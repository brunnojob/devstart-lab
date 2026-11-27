package dev.forgescope;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;
import static dev.forgescope.Data.*;
/** CIFuse relative JS/TS import checks; bounded heuristics, no package execution. */
public final class CodeDiagnostics {
    private CodeDiagnostics() {}
    static final Pattern IMP=Pattern.compile("\\b(?:from\\s*|import\\s*\\(\\s*|require\\s*\\(\\s*|import\\s*)(['\"])(\\.[^'\"\\r\\n]+)\\1");
    static final List<String> EXT=List.of("",".js",".jsx",".ts",".tsx",".mts",".mjs",".cts",".cjs","/index.js","/index.jsx","/index.ts","/index.tsx");
    public static List<Object> analyze(Map<String,String> files) {
        var rows=new ArrayList<Object>();var paths=files.keySet();
        for(var entry:files.entrySet()){
            String source=entry.getKey();
            if(!source.matches("(?i).*\\.(?:[cm]?[jt]sx?)$"))continue;
            String content=entry.getValue();var matcher=IMP.matcher(content);
            while(matcher.find()&&rows.size()<100){
                String spec=matcher.group(2);
                Path parent=Path.of(source).getParent(),rel=(parent==null?Path.of(spec):parent.resolve(spec)).normalize();
                String name=rel.toString().replace('\\','/');
                if(rel.isAbsolute()||name.equals("..")||name.startsWith("../"))continue;
                var targets=new LinkedHashSet<String>();for(String suffix:EXT)targets.add(name+suffix);
                if(name.endsWith(".js"))targets.add(name.substring(0,name.length()-3)+".ts");
                if(name.endsWith(".mjs"))targets.add(name.substring(0,name.length()-4)+".mts");
                if(name.endsWith(".cjs"))targets.add(name.substring(0,name.length()-4)+".cts");
                if(targets.stream().anyMatch(paths::contains))continue;
                var near=new TreeSet<String>();for(String expected:targets)for(String p:paths)if(expected.equalsIgnoreCase(p))near.add(p);
                int line=1;for(int i=0;i<matcher.start();i++)if(content.charAt(i)=='\n')line++;
                if(near.size()==1)Engines.add(rows,"cifuse","import-case","Review a case-sensitive import path","medium",source,line,spec+" -> "+near.first(),"Confirm the relative import casing on Linux and rerun the build.");
                else if(near.isEmpty())Engines.add(rows,"cifuse","import-unresolved","Review an unresolved relative import","low",source,line,spec+" -> "+name,"Check tsconfig aliases, generated modules, extensions and excluded paths before editing.");
                else Engines.add(rows,"cifuse","import-ambiguous","Review an ambiguous import path","medium",source,line,spec+" -> "+String.join(", ",near),"Multiple case-insensitive candidates exist. Check the intended import.");
            }
        }
        return rows;
    }
}
