package dev.forgescope;

import java.util.*;

/** Small strict JSON codec: duplicate keys, invalid numbers and excess nesting are rejected. */
public final class Json {
    private Json() {}
    public static Object parse(String text) { var p=new Parser(text); Object v=p.value(0);p.ws();if(p.i!=text.length())throw p.bad();return v; }
    public static String write(Object value) { var out=new StringBuilder();encode(value,out);return out.toString(); }
    private static void encode(Object v,StringBuilder b) {
        if(v==null){b.append("null");return;}
        if(v instanceof String s){b.append('"');for(char c:s.toCharArray()){switch(c){case '"'->b.append("\\\"");case '\\'->b.append("\\\\");case '\n'->b.append("\\n");case '\r'->b.append("\\r");case '\t'->b.append("\\t");default->{if(c<32)b.append(String.format("\\u%04x",(int)c));else b.append(c);}}}b.append('"');}
        else if(v instanceof Boolean || v instanceof Number){if((v instanceof Double d&&!Double.isFinite(d))||(v instanceof Float f&&!Float.isFinite(f)))throw new IllegalArgumentException("Non-finite JSON");b.append(v);}
        else if(v instanceof Map<?,?> m){b.append('{');boolean first=true;for(var e:m.entrySet()){if(!first)b.append(',');first=false;encode(String.valueOf(e.getKey()),b);b.append(':');encode(e.getValue(),b);}b.append('}');}
        else if(v instanceof Iterable<?> a){b.append('[');boolean first=true;for(var x:a){if(!first)b.append(',');first=false;encode(x,b);}b.append(']');}
        else throw new IllegalArgumentException("Unsupported JSON type "+v.getClass());
    }
    private static final class Parser {
        final String s;int i;Parser(String s){this.s=s;}
        IllegalArgumentException bad(){return new IllegalArgumentException("Invalid JSON at offset "+i);}
        void ws(){while(i<s.length()&&" \t\r\n".indexOf(s.charAt(i))>=0)i++;}
        Object value(int depth){if(depth>100)throw bad();ws();if(i>=s.length())throw bad();char c=s.charAt(i);
            if(c=='"')return string();if(c=='{'||c=='['){i++;boolean object=c=='{';var map=new LinkedHashMap<String,Object>();var list=new ArrayList<Object>();ws();if(take(object?'}':']'))return object?map:list;
                do {ws();if(object){if(i>=s.length()||s.charAt(i)!='"')throw bad();String key=string();ws();if(!take(':')||map.containsKey(key))throw bad();map.put(key,value(depth+1));}else list.add(value(depth+1));ws();if(take(object?'}':']'))return object?map:list;if(!take(','))throw bad();}while(true);}
            for(String literal:List.of("true","false","null")){if(s.startsWith(literal,i)){i+=literal.length();return literal.equals("null")?null:literal.equals("true");}}
            int start=i;if(take('-')&&i==s.length())throw bad();if(take('0')){if(i<s.length()&&Character.isDigit(s.charAt(i)))throw bad();}else{if(i>=s.length()||s.charAt(i)<'1'||s.charAt(i)>'9')throw bad();while(i<s.length()&&Character.isDigit(s.charAt(i)))i++;}
            if(take('.')){int d=i;while(i<s.length()&&Character.isDigit(s.charAt(i)))i++;if(d==i)throw bad();}
            if(i<s.length()&&(s.charAt(i)=='e'||s.charAt(i)=='E')){i++;if(i<s.length()&&(s.charAt(i)=='+'||s.charAt(i)=='-'))i++;int d=i;while(i<s.length()&&Character.isDigit(s.charAt(i)))i++;if(d==i)throw bad();}
            try{return new java.math.BigDecimal(s.substring(start,i));}catch(NumberFormatException e){throw bad();}
        }
        boolean take(char c){if(i<s.length()&&s.charAt(i)==c){i++;return true;}return false;}
        String string(){if(!take('"'))throw bad();var b=new StringBuilder();while(i<s.length()){char c=s.charAt(i++);if(c=='"')return b.toString();if(c<32)throw bad();if(c=='\\'){if(i>=s.length())throw bad();c=s.charAt(i++);switch(c){case '"','\\','/'->b.append(c);case 'b'->b.append('\b');case 'f'->b.append('\f');case 'n'->b.append('\n');case 'r'->b.append('\r');case 't'->b.append('\t');case 'u'->{if(i+4>s.length())throw bad();try{b.append((char)Integer.parseInt(s.substring(i,i+4),16));}catch(NumberFormatException e){throw bad();}i+=4;}default->throw bad();}}else b.append(c);}throw bad();}
    }
}
