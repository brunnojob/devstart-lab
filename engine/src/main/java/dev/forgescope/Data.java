package dev.forgescope;
import java.util.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class Data {
    private Data() {}
    public static Map<String,Object> m(Object... pairs){var m=new LinkedHashMap<String,Object>();for(int i=0;i<pairs.length;i+=2)m.put((String)pairs[i],pairs[i+1]);return m;}
    @SuppressWarnings("unchecked") public static Map<String,Object> obj(Object v){return (Map<String,Object>)v;}
    @SuppressWarnings("unchecked") public static List<Object> arr(Object v){return v instanceof List<?>?(List<Object>)v:List.of();}
    public static String str(Object v){return v==null?"":v.toString();}
    public static int num(Object v){return v instanceof Number n?n.intValue():0;}
    public static String hash(String s){try{return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(s.getBytes(StandardCharsets.UTF_8))).substring(0,20);}catch(Exception e){throw new IllegalStateException(e);}}
    public static String redact(String s){return s.replaceAll("\\x1b\\[[0-?]*[ -/]*[@-~]","")
        .replaceAll("\\b(?:gh[pousr]_[\\w]+|github_pat_[\\w]+|AKIA[A-Z0-9]{16})\\b","[REDACTED]")
        .replaceAll("(?i)(Bearer\\s+)[\\w.~/+\\-=]+","$1[REDACTED]")
        .replaceAll("(?i)((?:password|secret|token|api_key)\\s*[=:]\\s*)(?:\"[^\"\\r\\n]*\"|'[^'\\r\\n]*'|[^\\s,;]+)","$1[REDACTED]")
        .replaceAll("(https?://)[^\\s/@]+:[^\\s/@]+@","$1[REDACTED]@");}
    public static Object clean(Object v){if(v instanceof String s)return redact(s);if(v instanceof List<?> l)return l.stream().map(Data::clean).toList();if(v instanceof Map<?,?> map){var r=m();map.forEach((k,x)->r.put(str(k),clean(x)));return r;}return v;}
    public static String html(Object v){return str(v).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace("\"","&quot;").replace("'","&#39;");}
}
