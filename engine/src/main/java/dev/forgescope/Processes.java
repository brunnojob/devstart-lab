package dev.forgescope;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.io.*;
import java.util.concurrent.TimeUnit;

public final class Processes {
    public record Result(int code,String stdout,String stderr,boolean timeout) {}
    public static Result run(List<String> argv,Path cwd,String input,int seconds,int limit)throws IOException,InterruptedException{
        Path out=Files.createTempFile("forgescope-out-",".tmp"),err=Files.createTempFile("forgescope-err-",".tmp");Process process=null;
        try {
            var builder=new ProcessBuilder(argv).directory(cwd.toFile()).redirectOutput(out.toFile()).redirectError(err.toFile());
            process=builder.start();try(var stdin=process.getOutputStream()){if(input!=null)stdin.write(input.getBytes(StandardCharsets.UTF_8));}
            long until=System.nanoTime()+Duration.ofSeconds(seconds).toNanos();boolean timeout=false;
            while(!process.waitFor(100,TimeUnit.MILLISECONDS)){if(System.nanoTime()>until||Files.size(out)>limit||Files.size(err)>limit){timeout=true;process.descendants().forEach(ProcessHandle::destroyForcibly);process.destroyForcibly();process.waitFor();break;}}
            if(Files.size(out)>limit||Files.size(err)>limit)throw new IOException("Process output limit exceeded");
            return new Result(timeout?-1:process.exitValue(),Files.readString(out),Files.readString(err),timeout);
        }finally{
            if(process!=null){
                if(process.isAlive()){process.descendants().forEach(ProcessHandle::destroyForcibly);process.destroyForcibly();process.waitFor(5,TimeUnit.SECONDS);}
                process.getInputStream().close();process.getErrorStream().close();process.getOutputStream().close();
            }
            deleteOutput(out);deleteOutput(err);
        }
    }
    // Windows can briefly retain redirected handles after waitFor reports exit.
    // Retry the sharing violation; a lingering descendant must not mask the result.
    static void deleteOutput(Path path)throws InterruptedException{
        for(int attempt=0;attempt<20;attempt++)try{Files.deleteIfExists(path);return;}catch(IOException e){Thread.sleep(50);}
        path.toFile().deleteOnExit();
    }
    public static List<String> git(Path root,String... args){var a=new ArrayList<>(List.of("git","--no-optional-locks","-c","core.hooksPath="+ (System.getProperty("os.name").startsWith("Windows")?"NUL":"/dev/null"),"-c","core.fsmonitor=false","-c","core.quotePath=false","-C",root.toAbsolutePath().toString()));a.addAll(List.of(args));return a;}
    public record Diff(String text,String revision,List<String> paths) {}
    public static Diff diff(Path root,String base)throws Exception{
        if(base.isBlank()||base.startsWith("-"))throw new IllegalArgumentException("Invalid base revision");
        var rev=run(git(root,"rev-parse","--verify","--end-of-options",base+"^{commit}"),root,null,15,2000000);
        if(rev.code()!=0)throw new IOException("Cannot resolve base commit");String sha=rev.stdout().trim();
        var diff=run(git(root,"diff","--relative","--no-ext-diff","--no-textconv","--no-color","--no-renames",sha,"--"),root,null,30,2000000);
        var names=run(git(root,"diff","--relative","--no-ext-diff","--no-textconv","--no-renames","--name-only","-z",sha,"--"),root,null,30,2000000);
        if(diff.code()!=0||names.code()!=0)throw new IOException("Cannot read Git diff");
        return new Diff(diff.stdout(),sha,Arrays.stream(names.stdout().split("\u0000")).filter(s->!s.isBlank()).toList());
    }
}
