package dev.forgescope;
import java.nio.file.*;
import java.util.*;
import java.sql.*;
import static dev.forgescope.Data.*;

/** Integration/regression tests executable with only JDK 21; optional JDBC and Roslyn tests are explicit. */
public final class TestMain {
    static int count=0;
    interface Work {void run()throws Exception;}
    static void check(boolean ok,String name){if(!ok)throw new AssertionError(name);count++;}
    static void rejects(Work work,String name)throws Exception{try{work.run();}catch(Exception e){count++;return;}throw new AssertionError(name);}
    static Map<String,String> sample(){return new TreeMap<>(Map.of(
        "src/shop/Pricing.java","package shop; public class Pricing { public static int total(int p,int q){ return p*q; } }",
        "src/shop/Orders.java","package shop; public class Orders { public static int checkout(){return Pricing.total(2,3);} }",
        "src/shop/Api.java","package shop; public class Api { public static int run(){ return Orders.checkout(); } }",
        "tests/shop/OrdersTest.java","package shop; public class OrdersTest { public static int verify(){return Orders.checkout();} }"));}
    public static void main(String[] args)throws Exception{
        var parsed=obj(Json.parse("{\"a\":[1,true,null,\"é\\n\"],\"b\":-1.2e3}"));check(arr(parsed.get("a")).size()==4,"JSON arrays");check(Json.write(parsed).contains("é\\n"),"JSON Unicode round trip");
        for(String invalid:List.of("{\"a\":1,\"a\":2}","[01]","[1,]","{","true false","\"a\n\"","[NaN]"))rejects(()->Json.parse(invalid),"Strict JSON rejects "+invalid);
        rejects(()->Json.parse("[".repeat(102)+"]".repeat(102)),"JSON depth bound");
        for(String invalid:List.of("../escape","/tmp/a","C:\\a.java","a\n.java"))rejects(()->Report.relative(invalid),"Relative path validation");
        var impact=Impact.analyze(sample(),List.of("src/shop/Pricing.java"),null,null);
        check(num(impact.get("modules"))==4,"Java source modules");check(arr(impact.get("affected")).size()==4,"Transitive semantic impact");
        check(arr(impact.get("test_candidates")).contains("tests/shop/OrdersTest.java"),"Test candidate reachability");
        check(arr(impact.get("calls")).stream().map(Data::obj).anyMatch(c->str(c.get("symbol")).equals("shop.Pricing.total")),"Resolved local Java method");
        check(arr(impact.get("warnings")).isEmpty(),"Valid isolated compilation diagnostics");
        var shadow=new TreeMap<>(Map.of("Pricing.java","public class Pricing { public static void run(){} }","Other.java","public class Other { static void call(Runnable Pricing){Pricing.run();} }"));
        var scoped=Impact.analyze(shadow,List.of("Pricing.java"),null,null);check(arr(scoped.get("calls")).isEmpty(),"Parameter shadowing doesn't invent local call");check(arr(scoped.get("unresolved_references")).isEmpty(),"External resolved method not marked missing");
        var broken=sample();broken.put("src/shop/Legacy.java","package shop; public class Legacy { public static int run(){return Pricing.oldTotal(2,3);} }");
        var missing=Impact.analyze(broken,List.of("src/shop/Pricing.java"),null,null);check(!arr(missing.get("unresolved_references")).isEmpty(),"Missing local member lead");check(!arr(missing.get("warnings")).isEmpty(),"Compiler uncertainty visible");
        var syntax=Impact.analyze(Map.of("Broken.java","class Broken { ("),List.of(),null,null);check(!arr(syntax.get("warnings")).isEmpty(),"Malformed Java is visible");
        var cycle=Impact.analyze(Map.of("A.java","class A { B other; }","B.java","class B { A other; }"),List.of("A.java"),null,null);check(arr(cycle.get("affected")).size()==2,"Cycle termination");
        var narrowed=Impact.analyze(sample(),List.of("src/shop/Pricing.java"),"shop.Pricing.total",null);check(arr(narrowed.get("changed")).size()==1,"Qualified symbol selection");
        var noSymbol=Impact.analyze(sample(),List.of("src/shop/Pricing.java"),"missing",null);check(arr(noSymbol.get("changed")).isEmpty(),"Missing selected symbol");
        var python=Impact.analyze(Map.of("a.py","value=1","b.py","from a import value"),List.of("a.py"),null,null);check(arr(python.get("affected")).size()==2,"Python import compatibility");check(arr(python.get("calls")).isEmpty(),"Python calls not fabricated");check(str(obj(obj(python.get("engines")).get("python")).get("status")).equals("limited"),"Python limitation explicit");
        var noWorker=Impact.analyze(Map.of("A.cs","class A {}"),List.of("A.cs"),null,null);check(str(obj(obj(noWorker.get("engines")).get("csharp")).get("status")).equals("unavailable"),"Missing .NET worker explicit");
        String diff="diff --git a/Pricing.java b/Pricing.java\n--- a/Pricing.java\n+++ b/Pricing.java\n@@ -1 +1 @@\n-old\n+eval(input);\ndiff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml\n--- a/.github/workflows/ci.yml\n+++ b/.github/workflows/ci.yml\n@@ -1 +1 @@\n-permissions: read-all\n+permissions: write-all\n";
        var patch=Engines.diff(diff);check(patch.paths().size()==2,"Diff path seeds");check(patch.findings().stream().map(Data::obj).anyMatch(f->f.get("rule").equals("workflow-privilege")),"Workflow privilege port");check(patch.findings().stream().map(Data::obj).anyMatch(f->f.get("rule").equals("dynamic-code")),"Dynamic-code port");
        rejects(()->Engines.diff("not a diff"),"Invalid diff rejected");rejects(()->Engines.diff("--- a/../../escape\n+++ b/../../escape\n"),"Diff path traversal rejected");
        var maintenance=Engines.maintenance(Map.of("README.md","# Fixture\n[missing](docs/no.md)\n","App.java","class App {}"));check(maintenance.stream().map(Data::obj).anyMatch(f->str(f.get("rule")).startsWith("docs.link")),"Broken Markdown target");check(maintenance.stream().map(Data::obj).anyMatch(f->f.get("rule").equals("ci.missing")),"Missing CI port");
        check(Engines.maintenance(Map.of("README.md","![image](assets/example.png)"),Set.of("README.md","assets/example.png")).stream().map(Data::obj).noneMatch(f->str(f.get("rule")).startsWith("docs.link")),"Binary link inventory is not mistaken for a missing target");
        var importFindings=CodeDiagnostics.analyze(Map.of("src/app.ts","import {feature} from './Feature';\n","src/feature.ts","export const feature=1;"));
        check(importFindings.stream().map(Data::obj).anyMatch(f->f.get("rule").equals("import-case")),"CIFuse detects case-only import mismatch");
        check(CodeDiagnostics.analyze(Map.of("app.js","import './found.js';","found.js","export {};")).isEmpty(),"CIFuse resolves existing import");
        var logs=Engines.logs(List.of(m("name","build.log","text","src/shop/Orders.java:1: error: cannot find symbol\nModuleNotFoundError: No module named 'shop'\nModuleNotFoundError: No module named 'shop'\n")),sample());
        check(logs.stream().map(Data::obj).anyMatch(f->f.get("engine").equals("cifuse")&&num(f.get("count"))==2),"Repeated log grouping");check(logs.stream().map(Data::obj).anyMatch(f->f.get("engine").equals("devrescue")),"Troubleshooting engine port");check(logs.stream().map(Data::obj).anyMatch(f->!arr(obj(f).get("locations")).isEmpty()),"Log evidence positions");
        check(!redact("API_KEY=secret-value").contains("secret-value"),"Credential redaction");
        Path repo=Files.createTempDirectory("forgescope-test-");try{
            System.clearProperty("forgescope.target.executed");Files.writeString(repo.resolve(".env"),"SECRET=x");Files.writeString(repo.resolve("Safe.java"),"class Safe { static { System.setProperty(\"forgescope.target.executed\",\"yes\"); } }");Files.write(repo.resolve("binary.bin"),new byte[]{0,1,2});Files.write(repo.resolve("empty.pcap"),new byte[]{(byte)0xd4,(byte)0xc3,(byte)0xb2,(byte)0xa1,2,0,4,0,0,0,0,0,0,0,0,0,(byte)0xff,(byte)0xff,0,0,1,0,0,0});
            try{Files.createSymbolicLink(repo.resolve("link.java"),repo.resolve("Safe.java"));}catch(Exception ignored){}
            var inv=Inventory.read(repo);check(inv.files().size()==1,"Secret names, binary and symlink exclusions");check(!inv.skipped().isEmpty(),"Skipped inventory is visible");
            var report=Report.make(repo,List.of("Safe.java"),null,"",List.of(),null);check(System.getProperty("forgescope.target.executed")==null,"Target code not initialized");check(arr(obj(report.get("artifacts")).get("signals")).stream().map(Data::obj).anyMatch(x->str(x.get("verification")).equals("pcap header")),"RevScope recognizes capture header");check(arr(report.get("tools")).stream().map(Data::obj).anyMatch(x->str(x.get("id")).equals("wireshark")),"RevScope suggests packet viewer");
            report.put("project","</script><img onerror=alert(1)>");String html=Html.render(report);check(!html.contains("</script><img"),"HTML encoding");check(!html.contains("<script"),"No JavaScript in portable report");
            var sarif=Report.sarif(report);check(sarif.get("version").equals("2.1.0"),"SARIF version");
            Path out=repo.resolve(".forgescope");Report.save(report,out);check(Files.isRegularFile(out.resolve("index.html"))&&Files.isRegularFile(out.resolve("report.sarif")),"Report files generated");
            var previous=Json.parse(Json.write(report));Report.baseline(report,previous);check(num(obj(report.get("comparison")).get("new"))==0,"Baseline stable identities");rejects(()->Report.baseline(report,m("schema_version",1,"findings",List.of("bad"))),"Malformed baseline entries");
            try{Class.forName("org.sqlite.JDBC");Report.history(report,repo.resolve("history.sqlite"));try(var connection=DriverManager.getConnection("jdbc:sqlite:"+repo.resolve("history.sqlite"));var statement=connection.createStatement();var rs=statement.executeQuery("SELECT COUNT(*) FROM runs")){check(rs.next()&&rs.getInt(1)==1,"SQLite durable history");}}catch(ClassNotFoundException e){System.out.println("SQLite test skipped: add JDBC jars to build/lib for full verification");}
        }finally{delete(repo);}
        for(String lang:List.of("en","pt-BR","es")){
            String localized=Html.render(m("project","locale-test","impact",m("modules",0),"engines",m(),"inventory",m()),lang);
            check(localized.contains("<html lang=\""+lang+"\""),"Report language "+lang);
            for(int step=1;step<=6;step++)check(localized.contains("id=\"tour-"+step+"\""),"Tour target "+lang+" / "+step);
            check(localized.contains("href=\"pt-br.html\"")&&localized.contains("href=\"es.html\""),"Offline language links "+lang);
            check(!localized.contains("<script"),"Native tour without JS "+lang);check(localized.contains("id=\"pipeline-1\""),"Real-evidence pipeline exists "+lang);check(localized.contains("id=\"pipeline-6\""),"Pipeline export stage exists "+lang);check(localized.contains("id=\"revscope-catalog\""),"Full RevScope catalog section exists "+lang);check(localized.contains("Wireshark")&&localized.contains("PCAPdroid"),"Full catalog rendered "+lang);
        }
        check(I18n.text("unknown custom plugin output","pt-BR").equals("unknown custom plugin output"),"Missing translation must not crash report");check(!I18n.text("Review a case-sensitive import path","pt-BR").equals("Review a case-sensitive import path"),"Source import translations present");
        check(I18n.language("pt").equals("pt-BR")&&I18n.language("bad\"><img").equals("en"),"Language aliases and input whitelist");
        for(Object engine:obj(Report.resource("log-rules.json")).values())for(Object value:arr(engine))for(String field:List.of("title","action")){
            String original=str(obj(value).get(field));check(!I18n.text(original,"pt-BR").equals(original)&&!I18n.text(original,"es").equals(original),"Log catalog translated: "+field);
        }
        gitAndValidation();
        if(args.length==2&&args[0].equals("--csharp-worker")){var c=Impact.analyze(Map.of("Pricing.cs","namespace Shop; public static class Pricing { public static int Total(int x)=>x; }","Orders.cs","namespace Shop; public static class Orders { public static int Run()=>Pricing.Total(1); }"),List.of("Pricing.cs"),null,Path.of(args[1]));check(arr(c.get("affected")).size()==2,"Java-to-.NET protocol transitive impact");check(str(obj(obj(c.get("engines")).get("csharp")).get("status")).equals("ok"),"Roslyn worker status");}
        System.out.println("Java core: "+count+" checks passed");
    }
    static void gitAndValidation()throws Exception{
        Path root=Files.createTempDirectory("forgescope-git-");Path patch=Files.createTempFile("forgescope-patch-",".diff");
        try{git(root,"init");git(root,"config","core.autocrlf","false");git(root,"config","user.name","Test");git(root,"config","user.email","test@example.com");
            Files.writeString(root.resolve("value.txt"),"before\n");Files.writeString(root.resolve("Check.java"),"import java.nio.file.*; class Check { public static void main(String[] a) throws Exception { if(!Files.readString(Path.of(\"value.txt\")).equals(\"after\\n\")) System.exit(1); } }");
            git(root,"add",".");git(root,"commit","-m","fixture");Files.writeString(root.resolve("value.txt"),"after\n");var diff=Processes.diff(root,"HEAD");check(diff.paths().equals(List.of("value.txt")),"Git changed inventory");check(diff.text().contains("+after"),"Git tracked working-tree diff");rejects(()->Processes.diff(root,"--output=bad"),"Git option injection rejection");
            Files.writeString(patch,diff.text());git(root,"checkout","--","value.txt");
            var valid=Validation.validate(root,patch,List.of(Path.of(System.getProperty("java.home"),"bin","java").toString(),"Check.java"),30);check(Boolean.TRUE.equals(valid.get("validated")),"Before-fail / after-pass patch validation: "+Json.write(valid));check(Files.readString(root.resolve("value.txt")).equals("before\n"),"Original checkout preserved");check(Processes.run(Processes.git(root,"status","--porcelain"),root,null,10,10000).stdout().isBlank(),"Validation worktree cleanup");
        }finally{delete(root);Files.deleteIfExists(patch);}
    }
    static void git(Path root,String... args)throws Exception{var result=Processes.run(Processes.git(root,args),root,null,20,2000000);if(result.code()!=0)throw new Exception(result.stderr());}
    static void delete(Path root)throws Exception{if(Files.exists(root))try(var walk=Files.walk(root)){for(Path p:walk.sorted(Comparator.reverseOrder()).toList()){p.toFile().setWritable(true);Files.deleteIfExists(p);}}}
}
