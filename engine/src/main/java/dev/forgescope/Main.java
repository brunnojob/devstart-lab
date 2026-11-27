package dev.forgescope;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import static dev.forgescope.Data.*;

public final class Main {
    public static void main(String[] args){int result=run(args);if(result!=0)System.exit(result);}
    public static int run(String[] args){
        try {
            if(Arrays.asList(args).contains("--help")||args.length==0){System.out.println("""
                ForgeScope 0.3.0 — Java 21 core + C#/.NET 10
                java -jar build/forgescope.jar REPOSITORY [options]
                  --changed relative/path       repeatable source impact seed
                  --symbol qualified.name       narrow starting files, not runtime impact
                  --diff change.diff            existing unified diff
                  --base HEAD~1                 tracked working-tree diff versus local commit
                  --log build.log               repeatable existing log, 2 MB combined
                  --csharp-worker path.dll      built Roslyn worker, required for C# analysis
                  --baseline report.json        compare previous findings
                  --history history.sqlite      optional SQLite JDBC history
                  --output .forgescope          HTML/JSON/Markdown/SARIF output
                  --fail-on never|high|engine-error
                Patch validation: java -jar build/forgescope.jar validate REPO PATCH --test-command '["java","Test.java"]'
                No target code, build scripts or annotation processors run during scans.
                """);return 0;}
            if(args[0].equals("validate"))return Validation.cli(Arrays.copyOfRange(args,1,args.length));
            Path root=Path.of(args[0]).toAbsolutePath().normalize();var changed=new ArrayList<String>();var logs=new ArrayList<Map<String,Object>>();String symbol=null,diff="",base=null,fail="never",format="all";Path out=Path.of(".forgescope"),worker=null,prior=null,history=null;boolean diffSupplied=false;
            for(int i=1;i<args.length;i++){
                String key=args[i];if(i+1==args.length)throw new IllegalArgumentException("Missing value for "+key);String value=args[++i];switch(key){
                    case "--changed"->changed.add(Report.relative(value));case "--symbol"->symbol=value;case "--diff"->{diff=read(Path.of(value),2000000);diffSupplied=true;}case "--base"->base=value;
                    case "--log"->logs.add(m("name",Path.of(value).getFileName().toString(),"text",read(Path.of(value),2000000)));
                    case "--csharp-worker"->worker=Path.of(value);case "--baseline"->prior=Path.of(value);case "--history"->history=Path.of(value);case "--output"->out=Path.of(value);case "--fail-on"->fail=value;case "--format"->format=value;
                    default->throw new IllegalArgumentException("Unknown option: "+key);
                }
            }
            if(base!=null&&diffSupplied)throw new IllegalArgumentException("--base and --diff are mutually exclusive");if(!Set.of("never","high","engine-error").contains(fail))throw new IllegalArgumentException("Invalid --fail-on value");
            Processes.Diff git=null;if(base!=null){git=Processes.diff(root,base);diff=git.text();changed.addAll(git.paths());}
            var report=Report.make(root,changed,symbol,diff,logs,worker);if(git!=null)report.put("git",m("base_commit",git.revision(),"comparison","base-to-tracked-working-tree","untracked_included",false));
            if(prior!=null)Report.baseline(report,Json.parse(read(prior,20000000)));if(history!=null)Report.history(report,history);if(format.equals("json")){Files.createDirectories(out);Report.write(out.resolve("report.json"),Json.write(report));}else if(format.equals("all"))Report.save(report,out);else throw new IllegalArgumentException("Invalid --format value");
            System.out.println(Json.write(m("version","0.3.0","report",out.resolve(format.equals("json")?"report.json":"index.html").toString(),"findings",arr(report.get("findings")).size(),"affected",arr(obj(report.get("impact")).get("affected")).size(),"engines",report.get("engines"))));
            if(fail.equals("high")&&arr(report.get("findings")).stream().map(Data::obj).anyMatch(f->Set.of("high","error").contains(str(f.get("priority")))))return 1;
            if(fail.equals("engine-error")&&obj(report.get("engines")).values().stream().map(Data::obj).anyMatch(e->Set.of("error","unavailable").contains(str(e.get("status")))))return 2;
            return 0;
        }catch(Exception e){System.err.println("ForgeScope: "+redact(str(e.getMessage())));return 2;}
    }
    public static String read(Path path,int max)throws Exception{try(var in=Files.newInputStream(path)){byte[] data=in.readNBytes(max+1);if(data.length>max)throw new IllegalArgumentException("Input too large: "+path.getFileName());return StandardCharsets.UTF_8.newDecoder().decode(java.nio.ByteBuffer.wrap(data)).toString();}}
}
