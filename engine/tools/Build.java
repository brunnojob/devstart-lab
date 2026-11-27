import java.nio.file.*;
import java.util.*;
import java.util.jar.*;
import javax.tools.*;
import java.io.*;

/** Run with JDK 21+: java tools/Build.java [test]. No Python, Node, Maven or Gradle required. */
public class Build {
    public static void main(String[] args)throws Exception{
        Path classes=Path.of("build/classes"),tests=Path.of("build/test-classes");
        for(Path dir:List.of(classes,tests)){if(Files.exists(dir))try(var walk=Files.walk(dir)){for(Path p:walk.sorted(Comparator.reverseOrder()).toList())Files.deleteIfExists(p);}Files.createDirectories(dir);}
        var compiler=ToolProvider.getSystemJavaCompiler();if(compiler==null)throw new IllegalStateException("Use a full JDK 21+, not a JRE");
        compile(compiler,Path.of("src/main/java"),classes,null);
        try(var files=Files.walk(Path.of("src/main/resources"))){for(Path p:files.filter(Files::isRegularFile).toList()){Path target=classes.resolve(Path.of("src/main/resources").relativize(p));Files.createDirectories(target.getParent());Files.copy(p,target,StandardCopyOption.REPLACE_EXISTING);}}
        try(var files=Files.walk(Path.of("assets/branding"))){for(Path p:files.filter(Files::isRegularFile).toList()){Path target=classes.resolve("branding").resolve(p.getFileName());Files.createDirectories(target.getParent());Files.copy(p,target,StandardCopyOption.REPLACE_EXISTING);}}
        try(var files=Files.walk(Path.of("third_party"))){for(Path p:files.filter(Files::isRegularFile).toList()){Path target=classes.resolve("META-INF/third-party").resolve(Path.of("third_party").relativize(p));Files.createDirectories(target.getParent());Files.copy(p,target,StandardCopyOption.REPLACE_EXISTING);}}
        Files.copy(Path.of("LICENSE"),classes.resolve("META-INF/LICENSE"),StandardCopyOption.REPLACE_EXISTING);
        var manifest=new Manifest();manifest.getMainAttributes().put(Attributes.Name.MANIFEST_VERSION,"1.0");manifest.getMainAttributes().put(Attributes.Name.MAIN_CLASS,"dev.forgescope.Main");manifest.getMainAttributes().put(Attributes.Name.CLASS_PATH,"lib/sqlite-jdbc.jar lib/slf4j-api.jar lib/slf4j-nop.jar");
        try(var jar=new JarOutputStream(Files.newOutputStream(Path.of("build/forgescope.jar")),manifest);var stream=Files.walk(classes)){for(Path p:stream.filter(Files::isRegularFile).sorted().toList()){var entry=new JarEntry(classes.relativize(p).toString().replace('\\','/'));entry.setTime(0);jar.putNextEntry(entry);Files.copy(p,jar);jar.closeEntry();}}
        System.out.println("Built build/forgescope.jar (Java 21)");
        if(Arrays.asList(args).contains("test")){compile(compiler,Path.of("src/test/java"),tests,classes.toString());String sep=File.pathSeparator;
            var command=new ArrayList<>(List.of(Path.of(System.getProperty("java.home"),"bin","java").toString(),"-cp",classes+sep+tests+sep+"build/lib/*","dev.forgescope.TestMain"));
            String worker=System.getenv("FORGESCOPE_CSHARP_WORKER");if(worker!=null){command.add("--csharp-worker");command.add(worker);}
            int code=new ProcessBuilder(command).inheritIO().start().waitFor();if(code!=0)System.exit(code);}
    }
    static void compile(JavaCompiler compiler,Path root,Path dest,String cp)throws Exception{
        var options=new ArrayList<>(List.of("--source","21","--target","21","-encoding","UTF-8","-proc:none","-d",dest.toString()));if(cp!=null){options.add("-cp");options.add(cp);}try(var files=Files.walk(root)){options.addAll(files.filter(p->p.toString().endsWith(".java")).sorted().map(Path::toString).toList());}if(compiler.run(null,null,null,options.toArray(String[]::new))!=0)throw new IllegalStateException("Compilation failed");
    }
}
