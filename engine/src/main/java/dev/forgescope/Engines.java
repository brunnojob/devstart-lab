package dev.forgescope;
import java.util.*;
import java.util.regex.*;
import java.nio.file.*;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import static dev.forgescope.Data.*;

/** Java ports of the local review rules; original provenance and licenses are retained. */
public final class Engines {
    private Engines() {}
    public static Map<String,Object> finding(String engine,String rule,String title,String priority,String path,Integer line,String evidence,String action){
        return m("id",hash(Json.write(List.of(engine,rule,str(path),line==null?0:line,evidence))),"engine",engine,"rule",rule,"title",title,"priority",priority,"path",path,"line",line,"evidence",redact(evidence),"action",redact(action));
    }
    static void add(List<Object> rows,String e,String r,String t,String level,String path,Integer line,String proof,String next){rows.add(finding(e,r,t,level,path,line,proof,next));}
    public static Map<String,Object> resource(String name)throws Exception{try(var in=Engines.class.getResourceAsStream("/"+name)){if(in==null)throw new IllegalStateException("Missing resource "+name);return obj(Json.parse(new String(in.readAllBytes(),StandardCharsets.UTF_8)));}}
    public record Patch(List<String> paths,List<Object> findings,List<Object> warnings) {}
    public static Patch diff(String text){
        var findings=new ArrayList<Object>();var paths=new LinkedHashSet<String>();var warnings=new ArrayList<Object>();
        String path=null;int newLine=0,files=0,lineCount=0;boolean sourceChanged=false,testChanged=false;var addedFiles=new HashSet<String>();var deletedPaths=new HashSet<String>();
        for(String line:text.split("\\R",-1)){
            if(++lineCount>60000)throw new IllegalArgumentException("Patch exceeds 60,000 lines");
            if(line.startsWith("diff --git ")){if(++files>500)throw new IllegalArgumentException("Patch exceeds 500 files");path=null;newLine=0;continue;}
            if(line.startsWith("--- ")||line.startsWith("+++ ")){
                String header=line.substring(4).split("\t",2)[0];if(header.equals("/dev/null")){if(line.startsWith("+++")&&path!=null)deletedPaths.add(path);continue;}
                String parsed=patchPath(header);if(line.startsWith("+++ ")||path==null){path=parsed;paths.add(path);}
                continue;
            }
            if(line.startsWith("@@")){var m=Pattern.compile("\\+(\\d+)").matcher(line);if(m.find())newLine=Integer.parseInt(m.group(1))-1;continue;}
            if(path==null)continue;
            if(line.startsWith("+")&&!line.startsWith("+++")){
                newLine++;String value=line.substring(1);addedFiles.add(path);if(Impact.isTest(path))testChanged=true;else if(path.matches(".*\\.(?:java|cs|py|[jt]sx?|c|cpp|go|rs)$"))sourceChanged=true;
                if(value.matches("(?i).*-----BEGIN .*PRIVATE KEY-----.*"))add(findings,"patchscope","private-key","Review private-key material","high",path,newLine,"Private key header added","Remove real key material and rotate exposed credentials.");
                if(Pattern.compile("(?i)(?:api[_-]?key|secret|token|password)\\s*[:=]\\s*['\"][^'\"]{8,}").matcher(value).find())add(findings,"patchscope","credential","Review a credential-like literal","high",path,newLine,"Credential-like assignment added","Verify whether it is a real secret and replace with a secret reference.");
                if(value.matches("(?i).*(?:DROP|TRUNCATE)\\s+(?:TABLE|DATABASE|SCHEMA)\\b.*"))add(findings,"patchscope","destructive-sql","Review potentially destructive SQL","high",path,newLine,"Destructive SQL added","Confirm the environment, backups and recovery procedure.");
                if(value.matches(".*(?:write-all|pull_request_target).*"))add(findings,"patchscope","workflow-privilege","Review this workflow privilege boundary","high",path,newLine,"Broad permissions or pull_request_target added","Check token scope and whether untrusted code can run.");
                if(value.matches(".*(?:\\beval\\s*\\(|\\bexec\\s*\\(|Runtime\\.getRuntime\\(\\)\\.exec|Process\\.Start).*"))add(findings,"patchscope","dynamic-code","Dynamic code or process execution was added","medium",path,newLine,"Execution boundary changed","Trace the input, argument boundaries and trust assumptions.");
                if(value.matches("(?i).*(?:verify\\s*=\\s*false|rejectUnauthorized\\s*:\\s*false|DangerousAcceptAnyServerCertificateValidator|curl\\s+-k).*"))add(findings,"patchscope","tls","Review disabled TLS verification","high",path,newLine,"TLS verification bypass pattern added","Restore verification and configure the correct trust chain.");
                if(path.startsWith(".github/workflows/")&&value.trim().matches("(?i)^uses:\\s*[^\\s#]+@(?:main|master|latest|v[0-9]+(?:\\.[0-9]+)*)\\s*(?:#.*)?$"))add(findings,"patchscope","action-pin","Review a branch- or tag-pinned action","medium",path,newLine,"Workflow action is not pinned to a full commit SHA","Verify the publisher and pin an immutable SHA when required by project policy.");
                if(value.matches(".*(?:\\bskip\\s*\\(|\\.only\\s*\\(|@Disabled|\\[Ignore|Skip\\s*=).*"))add(findings,"patchscope","test-scope","Review changed test scope","medium",path,newLine,"Skipped or exclusive test marker added","Confirm which tests actually execute.");
            }else if(line.startsWith(" "))newLine++;
            if(line.startsWith("Binary files ")||line.startsWith("GIT binary patch"))add(findings,"patchscope","binary","Review a binary change separately","medium",path,null,"Binary patch section","Use an appropriate artifact viewer; text rules do not inspect this payload.");
        }
        if(!text.isBlank()&&paths.isEmpty())throw new IllegalArgumentException("No supported unified diff headers found");
        for(String p:paths){
            if(p.startsWith(".github/workflows/"))add(findings,"patchscope","workflow","GitHub Actions behavior changed","medium",p,null,"Workflow file changed","Review triggers, permissions and action pinning.");
            if(p.matches("(?:^|.*/)(?:package\\.json|pyproject\\.toml|pom\\.xml|.*\\.csproj|go\\.mod|Cargo\\.toml)$")){
                if(paths.stream().noneMatch(x->x.matches(".*(?:lock|go\\.sum|packages\\.lock\\.json).*")))add(findings,"patchscope","lockfile","Check dependency reproducibility","medium",p,null,"Dependency manifest changed; no lock artifact in supplied patch","Review version pinning and the project's dependency policy.");}
            if(p.endsWith(".env")||p.contains("/.env"))add(findings,"patchscope","environment","Review environment configuration changes","medium",p,null,"Environment file changed","Check for secrets before committing.");
            if(Impact.isTest(p)&&deletedPaths.contains(p))add(findings,"patchscope","deleted-tests","Confirm replacement test coverage","high",p,null,"Test file deleted in this patch","Inspect the deletion and replacement behavior tests.");
        }
        if(sourceChanged&&!testChanged)for(String p:addedFiles)if(!Impact.isTest(p)&&p.matches(".*\\.(?:java|cs|py|[jt]sx?)$"))add(findings,"patchscope","test-coverage","Confirm behavior is covered","medium",p,null,"Source changed without changed test files in this patch","Check existing tests or add a regression case. This does not measure coverage.");
        return new Patch(new ArrayList<>(paths),findings,warnings);
    }
    static String patchPath(String raw){
        String p=raw;if(p.startsWith("\"")){try{p=str(Json.parse(p));}catch(Exception e){throw new IllegalArgumentException("Unsupported quoted diff path");}}
        if(p.startsWith("a/")||p.startsWith("b/"))p=p.substring(2);return Report.relative(p);
    }
    public static List<Object> maintenance(Map<String,String> files){
        return maintenance(files,files.keySet());
    }
    public static List<Object> maintenance(Map<String,String> files,Collection<String> availablePaths){
        var rows=new ArrayList<Object>();String readme=files.keySet().stream().filter(p->p.matches("(?i)^readme(?:\\.md|\\.rst|\\.txt)?$")).findFirst().orElse(null);
        if(readme==null)add(rows,"reporelief","docs.readme","Add a repository entry point","high",null,null,"No root README found","Document setup, usage and testing.");
        else for(var section:Map.of("setup","setup|install|getting started|quick start","usage","usage|how to use|quick start","testing","testing|tests|verification").entrySet())if(!Pattern.compile("(?i)"+section.getValue()).matcher(files.get(readme)).find())add(rows,"reporelief","docs."+section.getKey(),"Document "+section.getKey(),"medium",readme,null,"Section keywords not found","Add commands verified by a maintainer; keyword matching is heuristic.");
        if(files.keySet().stream().noneMatch(p->p.startsWith(".github/workflows/")))add(rows,"reporelief","ci.missing","Make checks repeatable","high",null,null,"No GitHub workflow found","Add a workflow for the real test/build commands.");
        if(files.keySet().stream().noneMatch(p->p.matches("(?i)^(?:license|licence|copying)(?:\\..*)?$")))add(rows,"reporelief","license.missing","Clarify reuse permissions","medium",null,null,"No root license file found","Choose and document an appropriate license.");
        var inventory=new HashSet<>(availablePaths);for(String p:availablePaths){int slash=p.lastIndexOf('/');while(slash>0){inventory.add(p.substring(0,slash));slash=p.lastIndexOf('/',slash-1);}}
        var link=Pattern.compile("!?\\[[^\\]]*]\\(([^\\s)]+)(?:\\s+[^)]*)?\\)");
        for(var entry:files.entrySet()){
            String p=entry.getKey(),text=entry.getValue();String[] lines=text.split("\\R",-1);boolean fenced=false;
            for(int i=0;i<lines.length;i++){
                String line=lines[i];if(line.stripLeading().startsWith("```")){fenced=!fenced;continue;}if(fenced)continue;
                if(p.endsWith(".md")){var matcher=link.matcher(line.replaceAll("`[^`]*`",""));while(matcher.find()){String value=matcher.group(1);if(value.startsWith("#")||value.startsWith("/")||value.matches("^[A-Za-z][A-Za-z0-9+.-]*:.*"))continue;try{String target=URLDecoder.decode(value.split("[?#]",2)[0],StandardCharsets.UTF_8);Path parent=Path.of(p).getParent();String normalized=(parent==null?Path.of(target):parent.resolve(target)).normalize().toString().replace('\\','/');if(!inventory.contains(normalized))add(rows,"reporelief","docs.link:"+p+":"+(i+1),"Repair a missing local Markdown target","medium",p,i+1,value+" -> "+normalized,"Restore the target or correct the relative link.");}catch(IllegalArgumentException ignored){}}}
                if(line.contains("TODO")||line.contains("FIXME"))add(rows,"reporelief","maintenance.marker","Review a maintenance marker","low",p,i+1,"TODO/FIXME marker","Confirm whether follow-up work is still required.");
            }
            if(p.matches(".*\\.(?:java|cs|py|[jt]sx?)$")&&!Impact.isTest(p)){
                if(lines.length>400)add(rows,"reporelief","module.large","Review a large module","medium",p,null,lines.length+" lines","Add characterization tests before splitting responsibilities.");
                String stem=Path.of(p).getFileName().toString().replaceFirst("\\.[^.]+$","");boolean matching=files.keySet().stream().filter(Impact::isTest).anyMatch(t->Path.of(t).getFileName().toString().toLowerCase(Locale.ROOT).contains(stem.toLowerCase(Locale.ROOT)));
                if(!matching)add(rows,"reporelief","tests.match:"+p,"Review a module without a matching test name","medium",p,null,"No conventional test filename match","Find existing coverage or add a behavior test; this is not measured coverage.");
            }
        }return rows;
    }
    public static List<Object> logs(List<Map<String,Object>> logs,Map<String,String> files)throws Exception{
        var rows=new ArrayList<Object>();var catalog=resource("log-rules.json");var compiled=new HashMap<String,Pattern>();
        for(String engine:List.of("cifuse","devrescue")){
            var groups=new LinkedHashMap<String,Map<String,Object>>();
            for(var log:logs){String name=str(log.get("name"));String[] lines=redact(str(log.get("text"))).split("\\R",-1);String remembered=null;Integer rememberedLine=null;
                for(int i=0;i<lines.length;i++){
                    String line=lines[i];var py=Pattern.compile("File \"([^\"]+)\", line (\\d+)").matcher(line);if(py.find()){remembered=py.group(1);rememberedLine=Integer.parseInt(py.group(2));}
                    var loc=Pattern.compile("(?:^|\\s)([^\\s():]+\\.[A-Za-z0-9]+)(?::(\\d+)|\\((\\d+),\\d+\\))").matcher(line);String location=remembered;Integer at=rememberedLine;if(loc.find()){location=loc.group(1);at=Integer.parseInt(loc.group(2)!=null?loc.group(2):loc.group(3));}
                    for(Object ruleValue:arr(catalog.get(engine))){var rule=obj(ruleValue);int flags=str(rule.get("flags")).contains("i")?Pattern.CASE_INSENSITIVE:0;
                        String patternKey=engine+":"+str(rule.get("id"));Pattern pattern=compiled.computeIfAbsent(patternKey,k->Pattern.compile(str(rule.get("pattern")),flags));if(!pattern.matcher(line).find())continue;
                        String path=source(files,location),ruleId=str(rule.get("id"));String sig=engine+":"+ruleId+":"+line.trim().replaceAll("\\b\\d+\\b","#").toLowerCase(Locale.ROOT)+":"+str(path);
                        var item=groups.get(sig);if(item==null){item=finding(engine,ruleId,str(rule.get("title")),"medium",path,at,line.substring(0,Math.min(line.length(),1200)),str(rule.get("action")));item.put("count",0);item.put("locations",new ArrayList<Object>());item.put("log",name);item.put("log_line",i+1);groups.put(sig,item);}item.put("count",num(item.get("count"))+1);var occurrences=arr(item.get("locations"));if(occurrences.size()<8){var context=new ArrayList<String>();for(int atLine=Math.max(0,i-1);atLine<=Math.min(lines.length-1,i+1);atLine++)context.add(lines[atLine].substring(0,Math.min(500,lines[atLine].length())));occurrences.add(m("log",name,"line",i+1,"context",context));}
                        if(engine.equals("cifuse"))break;
                    }
                    if(line.isBlank()){remembered=null;rememberedLine=null;}
                }
            }rows.addAll(groups.values());
        }return rows;
    }
    static String source(Map<String,String> files,String raw){if(raw==null)return null;String path=raw.replace('\\','/');var matches=files.keySet().stream().filter(p->p.equals(path)||path.endsWith("/"+p)).toList();return matches.size()==1?matches.getFirst():null;}
}
