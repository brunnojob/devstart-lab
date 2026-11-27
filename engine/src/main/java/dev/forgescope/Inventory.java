package dev.forgescope;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.nio.charset.*;
import java.io.*;
import java.util.*;
import static dev.forgescope.Data.*;

public final class Inventory {
    public record Result(Map<String,String> files,List<Object> skipped) {}
    static final Set<String> IGNORE=Set.of(".git",".venv","venv","__pycache__","node_modules","vendor","build","dist",".forgescope",".tox","bin","obj","target");
    public static Result read(Path root) throws IOException {
        root=root.toRealPath();if(!Files.isDirectory(root))throw new IOException("Repository must be a directory");
        final Path base=root;var files=new TreeMap<String,String>();var skipped=new ArrayList<Object>();long[] total={0};
        Files.walkFileTree(root,new SimpleFileVisitor<>(){
            private String relative(Path p){return base.relativize(p).toString().replace('\\','/');}
            public FileVisitResult preVisitDirectory(Path dir,BasicFileAttributes a){return !dir.equals(base)&&IGNORE.contains(dir.getFileName().toString())?FileVisitResult.SKIP_SUBTREE:FileVisitResult.CONTINUE;}
            public FileVisitResult visitFile(Path p,BasicFileAttributes a)throws IOException{
                String rel=relative(p),name=p.getFileName().toString(),reason=null;
                if(a.isSymbolicLink())reason="symlink";else if(!a.isRegularFile())reason="non-regular";else if(name.equals(".env")||name.startsWith(".env."))reason="secret-name";else if(a.size()>512000)reason="file size limit";
                if(reason==null){try(var in=Files.newInputStream(p)){byte[] data=in.readNBytes(512001);if(data.length>512000)reason="file size limit";else {for(byte b:data)if(b==0){reason="binary";break;}
                    if(reason==null){String text=StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(java.nio.ByteBuffer.wrap(data)).toString();total[0]+=data.length;if(total[0]>20000000||files.size()>=10000)throw new LimitException();files.put(rel,text);}}}
                    catch(LimitException e){throw e;}catch(CharacterCodingException e){reason="binary or non-UTF-8";}catch(IOException e){reason="read error";}}
                if(reason!=null)skipped.add(m("path",rel,"reason",reason));return FileVisitResult.CONTINUE;
            }
            public FileVisitResult visitFileFailed(Path p,IOException e){skipped.add(m("path",relative(p),"reason","read error"));return FileVisitResult.CONTINUE;}
        });return new Result(files,skipped);
    }
    static final class LimitException extends IOException {LimitException(){super("Inventory limit exceeded: 20 MB / 10,000 files");}}
}
