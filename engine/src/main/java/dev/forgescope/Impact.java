package dev.forgescope;

import java.util.*;
import java.nio.file.*;
import java.net.URI;
import java.io.*;
import javax.tools.*;
import javax.lang.model.element.*;
import com.sun.source.tree.*;
import com.sun.source.util.*;
import static dev.forgescope.Data.*;

public final class Impact {
    private Impact() {}
    public static Map<String,Object> empty(){return m("modules",0,"edges",new ArrayList<>(),"calls",new ArrayList<>(),"symbols",new ArrayList<>(),"warnings",new ArrayList<>(),"dynamic_sites",new ArrayList<>(),"unresolved_references",new ArrayList<>(),"changed",new ArrayList<>(),"affected",new ArrayList<>(),"test_candidates",new ArrayList<>(),"engines",m());}
    public static Map<String,Object> analyze(Map<String,String> files,List<String> changed,String symbol,Path worker)throws Exception{
        var r=empty();var engine=obj(r.get("engines"));
        javaSources(files,r);engine.put("java",m("status","ok","mode","javac semantic model, isolated classpath, processors disabled"));
        pythonImports(files,r);engine.put("python",m("status",files.keySet().stream().anyMatch(p->p.endsWith(".py"))?"limited":"skipped","mode","import-only lexical compatibility; no Python AST or call resolution"));
        var cs=new TreeMap<String,String>();files.forEach((p,t)->{if(p.endsWith(".cs"))cs.put(p,t);});
        if(!cs.isEmpty()){
            if(worker==null){engine.put("csharp",m("status","unavailable","reason","Supply --csharp-worker with the built ForgeScope.Worker.dll"));}
            else try{var process=Processes.run(List.of("dotnet",worker.toAbsolutePath().toString()),Path.of(".").toAbsolutePath(),Json.write(m("files",cs)),45,20000000);
                if(process.code()!=0)throw new IOException("C# worker failed");var c=obj(Json.parse(process.stdout()));
                for(String field:List.of("edges","calls","symbols","warnings","dynamic_sites","unresolved_references"))arr(r.get(field)).addAll(arr(c.get(field)));
                r.put("modules",num(r.get("modules"))+num(c.get("modules")));engine.put("csharp",m("status","ok","mode","Roslyn semantic model; no MSBuild evaluation"));
            }catch(Exception e){engine.put("csharp",m("status","error","reason",e.getClass().getSimpleName()+": "+e.getMessage()));}
        }else engine.put("csharp",m("status","skipped","reason","No C# files"));
        var seeds=new TreeSet<>(changed);
        if(symbol!=null){seeds.removeIf(p->arr(r.get("symbols")).stream().map(Data::obj).noneMatch(s->p.equals(s.get("path"))&&(symbol.equals(s.get("name"))||symbol.equals(s.get("qualified_name")))));if(seeds.isEmpty())arr(r.get("warnings")).add(m("path",symbol,"reason","Selected definition not found"));}
        r.put("changed",new ArrayList<>(seeds));
        var reverse=new HashMap<String,List<Map<String,Object>>>();for(Object v:arr(r.get("edges"))){var e=obj(v);reverse.computeIfAbsent(str(e.get("target")),k->new ArrayList<>()).add(e);}
        var chains=new LinkedHashMap<String,List<Object>>();var queue=new ArrayDeque<String>();for(String p:seeds){chains.put(p,List.of());queue.add(p);}
        while(!queue.isEmpty()){String target=queue.remove();for(var e:reverse.getOrDefault(target,List.of())){String source=str(e.get("source"));if(!chains.containsKey(source)){var path=new ArrayList<>(chains.get(target));path.add(e);chains.put(source,path);queue.add(source);}}}
        var affected=arr(r.get("affected"));var tests=arr(r.get("test_candidates"));chains.forEach((p,chain)->{boolean test=isTest(p);affected.add(m("path",p,"distance",chain.size(),"chain",chain,"test",test));if(test)tests.add(p);});
        r.put("limits","Java/C# bindings use an isolated source compilation, not the project build graph. External dependencies, reflection, generated code and runtime dispatch are incomplete. Python compatibility resolves imports only.");return r;
    }
    public static boolean isTest(String p){return p.matches("(?i).*(?:^|/)(?:tests?|__tests__)(?:/|$).*")||Path.of(p).getFileName().toString().matches("(?i)(?:test_.*|.*(?:Test|Tests|_test)\\.(?:java|cs|py))");}
    static final class Source extends SimpleJavaFileObject {
        final String path,text;
        Source(String p,String t){super(uri(p),Kind.SOURCE);path=p;text=t;}
        static URI uri(String p){try{return new URI("string",null,"/"+p,null);}catch(Exception e){throw new IllegalArgumentException(e);}}
        public CharSequence getCharContent(boolean ignore){return text;}
        public String getName(){return path;}
    }
    static void javaSources(Map<String,String> files,Map<String,Object> result)throws Exception{
        var inputs=files.entrySet().stream().filter(e->e.getKey().endsWith(".java")).map(e->new Source(e.getKey(),e.getValue())).toList();if(inputs.isEmpty())return;
        var compiler=ToolProvider.getSystemJavaCompiler();if(compiler==null)throw new IOException("A full JDK 21+ is required");
        var diagnostics=new DiagnosticCollector<JavaFileObject>();Path noClasspath=Files.createTempDirectory("forgescope-classpath-");
        try(var manager=compiler.getStandardFileManager(diagnostics,Locale.ROOT,java.nio.charset.StandardCharsets.UTF_8)){
            var task=(JavacTask)compiler.getTask(null,manager,diagnostics,List.of("-proc:none","-implicit:none","-classpath",noClasspath.toString(),"--source","21"),null,inputs);
            var units=new ArrayList<CompilationUnitTree>();task.parse().forEach(units::add);try{task.analyze();}catch(RuntimeException e){arr(result.get("warnings")).add(m("reason","Java semantic analysis incomplete","detail",e.getClass().getSimpleName()));}
            Trees trees=Trees.instance(task);var keys=new HashSet<String>();
            for(var unit:units){String path=unit.getSourceFile().getName();
                new TreePathScanner<Void,Void>(){
                    String caller="";
                    private int line(Tree node){return (int)unit.getLineMap().getLineNumber(trees.getSourcePositions().getStartPosition(unit,node));}
                    private String owner(Element e){while(e!=null&&!(e instanceof TypeElement))e=e.getEnclosingElement();return e instanceof TypeElement t?t.getQualifiedName().toString():"";}
                    private String qualified(Element e){return owner(e)+(e instanceof TypeElement?"":"."+e.getSimpleName());}
                    private String target(Element e){if(e==null)return null;TreePath declaration=trees.getPath(e);return declaration==null?null:declaration.getCompilationUnit().getSourceFile().getName();}
                    private void dependency(Tree node){Element e=trees.getElement(getCurrentPath());String dest=target(e);if(dest!=null&&!dest.equals(path)){String key=path+":"+line(node)+":"+dest;if(keys.add(key))arr(result.get("edges")).add(m("source",path,"target",dest,"line",line(node),"import",qualified(e),"kind","semantic-reference","language","java"));}}
                    public Void visitIdentifier(IdentifierTree n,Void v){dependency(n);return super.visitIdentifier(n,v);}
                    public Void visitMemberSelect(MemberSelectTree n,Void v){dependency(n);return super.visitMemberSelect(n,v);}
                    public Void visitClass(ClassTree n,Void v){Element e=trees.getElement(getCurrentPath());if(e!=null)arr(result.get("symbols")).add(m("path",path,"name",n.getSimpleName().toString(),"qualified_name",qualified(e),"line",line(n),"kind","class","language","java"));return super.visitClass(n,v);}
                    public Void visitMethod(MethodTree n,Void v){Element e=trees.getElement(getCurrentPath());String before=caller;caller=e==null?n.getName().toString():qualified(e);arr(result.get("symbols")).add(m("path",path,"name",n.getName().toString(),"qualified_name",caller,"line",line(n),"kind","method","language","java"));super.visitMethod(n,v);caller=before;return null;}
                    public Void visitMethodInvocation(MethodInvocationTree n,Void v){Element e=trees.getElement(getCurrentPath());String dest=target(e);if(e instanceof ExecutableElement&&dest!=null){arr(result.get("calls")).add(m("source",path,"target",dest,"line",line(n),"symbol",qualified(e),"caller",caller,"confidence","source-symbol-resolved","language","java"));}
                        else if(!(e instanceof ExecutableElement)&&n.getMethodSelect() instanceof MemberSelectTree select){TreePath receiverPath=TreePath.getPath(unit,select.getExpression());Element receiver=trees.getElement(receiverPath);String destination=receiver instanceof TypeElement?target(receiver):null;if(destination!=null)arr(result.get("unresolved_references")).add(m("path",path,"target",destination,"line",line(n),"symbol",n.getMethodSelect().toString(),"confidence","review-required","reason","Invocation did not resolve against a supplied local source type; missing dependencies can affect binding."));}
                        if(n.getMethodSelect().toString().contains(".forName")||n.getMethodSelect().toString().contains(".invoke"))arr(result.get("dynamic_sites")).add(m("path",path,"line",line(n),"expression",n.getMethodSelect().toString()));return super.visitMethodInvocation(n,v);}
                }.scan(unit,null);
            }
            for(var d:diagnostics.getDiagnostics().stream().limit(1000).toList())if(d.getKind()==Diagnostic.Kind.ERROR)arr(result.get("warnings")).add(m("path",d.getSource()==null?"":d.getSource().getName(),"line",d.getLineNumber(),"reason","Java compiler diagnostic in isolated analysis","code",d.getCode(),"detail",d.getMessage(Locale.ROOT)));
            result.put("modules",num(result.get("modules"))+units.size());
        }finally{Files.deleteIfExists(noClasspath);}
    }
    static void pythonImports(Map<String,String> files,Map<String,Object> result){
        var modules=new HashMap<String,List<String>>();files.keySet().stream().filter(p->p.endsWith(".py")).forEach(p->{String n=p.replaceFirst("^src/","").replaceFirst("\\.py$","").replaceFirst("/__init__$","").replace('/','.');modules.computeIfAbsent(n,k->new ArrayList<>()).add(p);});
        var pattern=java.util.regex.Pattern.compile("^\\s*(?:from\\s+([.\\w]+)\\s+import\\s+([\\w*, ]+)|import\\s+([\\w., ]+))");
        for(var entry:files.entrySet()){String path=entry.getKey();if(!path.endsWith(".py"))continue;String module=path.replaceFirst("^src/","").replaceFirst("\\.py$","").replace('/','.');String pkg=module.contains(".")?module.substring(0,module.lastIndexOf('.')):"";
            String[] lines=entry.getValue().split("\\R");boolean triple=false;for(int i=0;i<lines.length;i++){String line=lines[i];if(line.contains("\"\"\"")||line.contains("'''")){triple=!triple;continue;}if(triple)continue;var match=pattern.matcher(line);if(!match.find())continue;String base=match.group(1),target=base==null?match.group(3).split(",")[0].trim():base;
                if(target.startsWith(".")){int dots=0;while(dots<target.length()&&target.charAt(dots)=='.')dots++;var parts=new ArrayList<>(List.of(pkg.split("\\.")));if(dots>parts.size())continue;for(int j=1;j<dots;j++)parts.removeLast();target=String.join(".",parts)+(target.substring(dots).isEmpty()?"":"."+target.substring(dots));}
                var candidates=modules.getOrDefault(target,List.of());if(candidates.size()==1&&!candidates.getFirst().equals(path))arr(result.get("edges")).add(m("source",path,"target",candidates.getFirst(),"line",i+1,"import",target,"kind","lexical-import","language","python"));}
            arr(result.get("warnings")).add(m("path",path,"reason","Python import-only compatibility: lexical matches may include optional imports; no Python AST or function-call analysis"));result.put("modules",num(result.get("modules"))+1);
        }
    }
}
