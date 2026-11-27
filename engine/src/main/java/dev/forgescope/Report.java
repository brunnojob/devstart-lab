package dev.forgescope;
import java.util.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.sql.*;
import java.io.IOException;
import static dev.forgescope.Data.*;

public final class Report {
    private Report() {}
    public static String relative(String path){String p=path.replace('\\','/').replaceFirst("^\\./","");if(p.isBlank()||p.startsWith("/")||p.matches("^[A-Za-z]:.*")||Arrays.asList(p.split("/")).contains("..")||p.chars().anyMatch(c->c<32))throw new IllegalArgumentException("Expected a repository-relative path without control characters or ..");return p;}
    public static Object resource(String name)throws Exception{try(var in=Report.class.getResourceAsStream("/"+name)){if(in==null)throw new IllegalStateException("Missing resource: "+name);return Json.parse(new String(in.readAllBytes(),StandardCharsets.UTF_8));}}
    public static Map<String,Object> make(Path root,List<String> inputChanged,String symbol,String diff,List<Map<String,Object>> logs,Path worker)throws Exception{
        if(diff.getBytes(StandardCharsets.UTF_8).length>2000000||logs.size()>20||logs.stream().mapToInt(l->str(l.get("text")).getBytes(StandardCharsets.UTF_8).length).sum()>2000000)throw new IllegalArgumentException("Diff/log input exceeds limits");
        var inventory=Inventory.read(root);var files=inventory.files();var patch=Engines.diff(diff);var changed=new TreeSet<String>();inputChanged.forEach(p->changed.add(relative(p)));changed.addAll(patch.paths());
        var impact=Impact.analyze(files,new ArrayList<>(changed),symbol,worker);var rows=new ArrayList<Object>();var available=new HashSet<>(files.keySet());for(Object skipped:inventory.skipped()){var s=obj(skipped);if(!Set.of("symlink","secret-name","non-regular").contains(str(s.get("reason"))))available.add(str(s.get("path")));}rows.addAll(patch.findings());rows.addAll(Engines.maintenance(files,available));rows.addAll(Engines.logs(logs,files));rows.addAll(CodeDiagnostics.analyze(files));
        for(Object v:arr(impact.get("unresolved_references"))){var ref=obj(v);rows.add(Engines.finding("impact","unresolved-local-reference","Review an unresolved local reference","medium",str(ref.get("path")),num(ref.get("line")),str(ref.get("symbol"))+": "+str(ref.get("reason")),"Inspect the declaration, signature, imports and missing dependency diagnostics. This is not a proof of root cause."));}
        var affected=new HashMap<String,Map<String,Object>>();for(Object v:arr(impact.get("affected"))){var a=obj(v);affected.put(str(a.get("path")),a);}
        for(Object v:rows){var f=obj(v);var hit=affected.get(str(f.get("path")));f.put("correlation",hit==null?null:m("relation","same file in impact set","distance",hit.get("distance")));}
        rows.sort(Comparator.comparingInt(v->{var f=obj(v);int level=switch(str(f.get("priority"))){case "high","error"->0;case "medium"->1;default->2;};return (f.get("correlation")==null?10:0)+level;}));
        var artifacts=ArtifactSignals.inspect(root,files,inventory.skipped());
        var tools=arr(artifacts.get("tools"));
        var statuses=m("revscope",m("status",arr(artifacts.get("signals")).isEmpty()?"skipped":"ok","implementation","Header triage and pinned catalog, no execution"),"patchscope",m("status",diff.isBlank()?"skipped":"ok","implementation","Java rule port"),"reporelief",m("status","ok","implementation","Java rule port"),"cifuse",m("status","ok","implementation","Java rule port"),"devrescue",m("status","ok","implementation","Java rule port"));
        obj(impact.get("engines")).forEach((name,status)->statuses.put("impact-"+name,status));
        var report=m("schema_version",1,"version","0.3.0","runtime",m("core","Java 21","csharp",".NET 10 / Roslyn","python_required",false,"node_required",false),
            "project",root.toRealPath().getFileName().toString(),"inventory",m("text_files",files.size(),"skipped",inventory.skipped()),"impact",impact,"engines",statuses,"findings",rows,"artifacts",m("signals",artifacts.get("signals"),"catalog_size",artifacts.get("catalog_size")),"tools",tools,"provenance",resource("provenance.json"),
            "limitations",List.of("Correlations are shared source evidence, not proof of root cause.","Java/C# source binding runs with an isolated classpath; project builds and external dependencies are not evaluated.","Python compatibility is import-only and lexical; the previous Python AST implementation is retained in Git history, not in this runtime.","Test candidates are source-reachable, not measured coverage.","Redaction is best effort. Inspect reports before sharing.","RevScope uses metadata and bounded header triage to recommend external tools; no binaries or captures are analyzed or executed."));
        return obj(clean(report));
    }
    public static void baseline(Map<String,Object> report,Object prior){
        if(!(prior instanceof Map<?,?>)||num(obj(prior).get("schema_version"))!=1||!(obj(prior).get("findings") instanceof List<?>))throw new IllegalArgumentException("Expected ForgeScope schema_version 1 baseline");
        var old=new HashSet<String>();for(Object v:arr(obj(prior).get("findings"))){if(!(v instanceof Map<?,?>)||!(obj(v).get("id") instanceof String))throw new IllegalArgumentException("Malformed baseline finding");old.add(str(obj(v).get("id")));}
        var current=new HashSet<String>();for(Object v:arr(report.get("findings"))){var f=obj(v);String id=str(f.get("id"));current.add(id);f.put("status",old.contains(id)?"existing":"new");}
        int same=(int)current.stream().filter(old::contains).count();report.put("comparison",m("new",current.size()-same,"existing",same,"absent",old.size()-same,"note","Absent evidence does not prove a repair. Rule-port wording can change finding identities across 0.2/0.3."));
    }
    public static Map<String,Object> sarif(Map<String,Object> report){
        var rules=new LinkedHashMap<String,Object>();var results=new ArrayList<Object>();
        for(Object value:arr(report.get("findings"))){var f=obj(value);String id=f.get("engine")+"/"+f.get("rule");rules.putIfAbsent(id,m("id",id,"shortDescription",m("text",f.get("title"))));
            String level=switch(str(f.get("priority"))){case "high","error"->"error";case "medium"->"warning";default->"note";};var r=m("ruleId",id,"level",level,"message",m("text",f.get("title")+"\n"+f.get("evidence")+"\nNext: "+f.get("action")),"partialFingerprints",m("forgescope/v1",f.get("id")),"properties",m("engine",f.get("engine"),"correlation",f.get("correlation")));
            String p=str(f.get("path"));if(!p.isBlank()){try{relative(p);String uri=Arrays.stream(p.split("/")).map(s->java.net.URLEncoder.encode(s,StandardCharsets.UTF_8).replace("+","%20")).collect(java.util.stream.Collectors.joining("/"));var physical=m("artifactLocation",m("uri",uri,"uriBaseId","%SRCROOT%"));if(num(f.get("line"))>0)physical.put("region",m("startLine",num(f.get("line"))));r.put("locations",List.of(m("physicalLocation",physical)));}catch(IllegalArgumentException ignored){}}
            if(Set.of("new","existing").contains(str(f.get("status"))))r.put("baselineState",str(f.get("status")).equals("new")?"new":"unchanged");results.add(r);
        }return m("$schema","https://json.schemastore.org/sarif-2.1.0.json","version","2.1.0","runs",List.of(m("tool",m("driver",m("name","ForgeScope","version","0.3.0","informationUri","https://github.com/brunnojob/forgescope","rules",new ArrayList<>(rules.values()))),"results",results)));
    }
    public static String markdown(Map<String,Object> r){var b=new StringBuilder("# ForgeScope investigation\n\nJava 21 + .NET 10 · "+html(r.get("project"))+"\n\n");for(Object v:arr(r.get("findings"))){var f=obj(v);b.append("## ").append(html(f.get("title"))).append("\n\n").append(html(f.get("engine"))).append(" · ").append(html(f.get("path"))).append(":").append(html(f.get("line"))).append("\n\n").append(html(f.get("evidence"))).append("\n\n").append(html(f.get("action"))).append("\n\n");}return b.toString().stripTrailing()+"\n";}
    public static void save(Map<String,Object> report,Path out)throws Exception{
        Files.createDirectories(out);
        Path brand=out.resolve("assets/branding");Files.createDirectories(brand);
        for(String name:List.of("favicon-32.png","apple-touch-icon.png","favicon.ico")){
            try(var in=Report.class.getResourceAsStream("/branding/"+name)){
                if(in==null)throw new IOException("Missing brand asset: "+name);
                Files.copy(in,brand.resolve(name),StandardCopyOption.REPLACE_EXISTING);
            }
        }
        Files.copy(brand.resolve("favicon.ico"),out.resolve("favicon.ico"),StandardCopyOption.REPLACE_EXISTING);
        write(out.resolve("report.json"),Json.write(report));write(out.resolve("report.sarif"),Json.write(sarif(report)));write(out.resolve("report.md"),markdown(report));for(String lang:List.of("en","pt-BR","es"))write(out.resolve(I18n.file(lang)),Html.render(report,lang));
    }
    static void write(Path file,String text)throws IOException{Path tmp=Files.createTempFile(file.toAbsolutePath().getParent(),".forgescope-",".tmp");try{Files.writeString(tmp,text);try{Files.move(tmp,file,StandardCopyOption.REPLACE_EXISTING,StandardCopyOption.ATOMIC_MOVE);}catch(AtomicMoveNotSupportedException e){Files.move(tmp,file,StandardCopyOption.REPLACE_EXISTING);}}finally{Files.deleteIfExists(tmp);}}
    public static void history(Map<String,Object> report,Path database)throws Exception{
        try{Class.forName("org.sqlite.JDBC");}catch(ClassNotFoundException e){throw new IOException("SQLite history requires the SQLite JDBC distribution; build with --with-history or use Maven package",e);}
        Path parent=database.toAbsolutePath().getParent();Files.createDirectories(parent);
        try(var c=DriverManager.getConnection("jdbc:sqlite:"+database.toAbsolutePath())){c.setAutoCommit(false);try(var s=c.createStatement()){s.execute("CREATE TABLE IF NOT EXISTS runs (id INTEGER PRIMARY KEY, created_at TEXT DEFAULT CURRENT_TIMESTAMP, project TEXT, report TEXT)");}try(var p=c.prepareStatement("INSERT INTO runs(project,report) VALUES (?,?)")){p.setString(1,str(report.get("project")));p.setString(2,Json.write(report));p.executeUpdate();}c.commit();}
    }
}
