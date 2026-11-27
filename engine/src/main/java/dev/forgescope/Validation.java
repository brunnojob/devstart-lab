package dev.forgescope;
import java.nio.file.*;
import java.util.*;
import static dev.forgescope.Data.*;

public final class Validation {
    public static Map<String,Object> validate(Path root,Path patch,List<String> argv,int timeout)throws Exception{
        if(argv.isEmpty()||argv.stream().anyMatch(String::isBlank)||timeout<1||timeout>300)throw new IllegalArgumentException("An explicit nonempty test argv and 1–300 second timeout are required");
        root=root.toRealPath();patch=patch.toRealPath();if(Files.size(patch)>2000000)throw new IllegalArgumentException("Patch exceeds 2 MB");
        var status=Processes.run(Processes.git(root,"status","--porcelain"),root,null,20,2000000);if(status.code()!=0||!status.stdout().isBlank())throw new IllegalArgumentException("Validation requires a clean, committed trusted repository");
        Path temp=Files.createTempDirectory("forgescope-validation-"),work=temp.resolve("checkout");boolean added=false;
        try{
            require(Processes.run(Processes.git(root,"worktree","add","--detach",work.toString(),"HEAD"),root,null,30,2000000));added=true;
            var before=Processes.run(argv,work,null,timeout,2000000);
            require(Processes.run(Processes.git(work,"reset","--hard","HEAD"),work,null,30,2000000));require(Processes.run(Processes.git(work,"clean","-fdx"),work,null,30,2000000));
            require(Processes.run(Processes.git(work,"apply","--check",patch.toString()),work,null,30,2000000));require(Processes.run(Processes.git(work,"apply",patch.toString()),work,null,30,2000000));
            var after=Processes.run(argv,work,null,timeout,2000000);
            return m("before",m("exit_code",before.timeout()?null:before.code(),"timed_out",before.timeout()),"after",m("exit_code",after.timeout()?null:after.code(),"timed_out",after.timeout()),"validated",!before.timeout()&&before.code()!=0&&!after.timeout()&&after.code()==0,"scope","Only the explicitly supplied tests. Edit isolation is not a security sandbox; original checkout preserved.");
        }finally{if(added)require(Processes.run(Processes.git(root,"worktree","remove","--force",work.toString()),root,null,30,2000000));if(Files.exists(temp))try(var walk=Files.walk(temp)){for(Path p:walk.sorted(Comparator.reverseOrder()).toList())Files.deleteIfExists(p);}}
    }
    static void require(Processes.Result r)throws Exception{if(r.code()!=0)throw new java.io.IOException("Git validation operation failed");}
    static int cli(String[] args)throws Exception{
        if(args.length<4)throw new IllegalArgumentException("validate REPO PATCH --test-command JSON_ARGV [--timeout 60] [--output validation.json]");
        List<String> argv=null;int timeout=60;Path out=Path.of("validation.json");
        for(int i=2;i<args.length;i++){String k=args[i];if(++i>=args.length)throw new IllegalArgumentException("Missing validation option value");switch(k){case "--test-command"->{Object parsed=Json.parse(args[i]);if(!(parsed instanceof List<?> list)||list.stream().anyMatch(v->!(v instanceof String)))throw new IllegalArgumentException("Test command must be a JSON array of strings");argv=arr(parsed).stream().map(Data::str).toList();}case "--timeout"->timeout=Integer.parseInt(args[i]);case "--output"->out=Path.of(args[i]);default->throw new IllegalArgumentException("Unknown validation option");}}
        if(argv==null)throw new IllegalArgumentException("Explicit --test-command is required");var result=validate(Path.of(args[0]),Path.of(args[1]),argv,timeout);Report.write(out,Json.write(result));System.out.println(Json.write(result));return Boolean.TRUE.equals(result.get("validated"))?0:1;
    }
}
