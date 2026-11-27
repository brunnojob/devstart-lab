package dev.forgescope;
import java.nio.file.*;
import java.util.*;
import static dev.forgescope.Data.*;
/** Metadata-only RevScope guidance: no binary or capture is executed or decoded. */
public final class ArtifactSignals {
    private ArtifactSignals() {}
    static String header(Path root,String path) {
        try {
            Path file=root.resolve(path).normalize();
            if(!file.startsWith(root.normalize())||!Files.isRegularFile(file,LinkOption.NOFOLLOW_LINKS))return "unverified";
            try(var in=Files.newInputStream(file)){
                byte[] h=in.readNBytes(16);
                if(h.length>=4) {
                    int a=h[0]&255,b=h[1]&255,c=h[2]&255,d=h[3]&255;
                    if((a==0xd4&&b==0xc3&&c==0xb2&&d==0xa1)||(a==0xa1&&b==0xb2&&c==0xc3&&d==0xd4)||(a==0x4d&&b==0x3c&&c==0xb2&&d==0xa1)||(a==0xa1&&b==0xb2&&c==0x3c&&d==0x4d))return "pcap header";
                    if(a==10&&b==13&&c==13&&d==10)return "pcapng header";
                    if(a==127&&b==69&&c==76&&d==70)return "ELF header";
                    if(a==77&&b==90)return "PE/MZ header";
                    if(a==80&&b==75&&c==3&&d==4)return "ZIP header";
                }
                return "extension only; format not confirmed";
            }
        }catch(Exception e){return "header unavailable";}
    }
    public static Map<String,Object> inspect(Path root,Map<String,String> files,List<Object> skipped)throws Exception{
        var all=new TreeSet<String>(files.keySet());
        for(Object x:skipped){var row=obj(x);if(!Set.of("symlink","secret-name","non-regular").contains(str(row.get("reason"))))all.add(str(row.get("path")));}
        var signals=new ArrayList<Object>();var chosen=new LinkedHashSet<String>();var reasons=new LinkedHashMap<String,String>();
        for(String path:all){
            if(signals.size()>=80)break;
            String name=path.toLowerCase(Locale.ROOT),kind=null,notice=null;List<String> ids=List.of();
            if(name.endsWith(".pcap")||name.endsWith(".pcapng")||name.endsWith(".cap")){kind="Network capture candidate";ids=List.of("wireshark");notice="Use a packet viewer only on authorized captures.";}
            else if(name.endsWith(".har")){kind="HTTP archive candidate";ids=List.of("burp-community","mitmproxy");notice="HTTP archives may include tokens and private headers.";}
            else if(name.endsWith(".apk")){kind="Android package candidate";ids=List.of("jadx","apktool");notice="A ZIP signature does not prove a valid APK.";}
            else if(name.endsWith(".exe")||name.endsWith(".dll")||name.endsWith(".so")||name.endsWith(".elf")){kind="Executable or library candidate";ids=List.of("die","ghidra");notice="Identify the format before static analysis.";}
            else if(name.endsWith(".bin")||name.endsWith(".hex")||name.endsWith(".img")||name.endsWith(".uf2")){kind="Unclassified binary / embedded artifact";ids=List.of("binwalk","ghidra");notice="An extension does not prove firmware.";}
            if(kind==null)continue;
            String verified=header(root,path);
            if(kind.startsWith("Network")&&(verified.equals("pcap header")||verified.equals("pcapng header")))kind="Recognized capture header";
            if(kind.startsWith("Executable")&&(verified.equals("ELF header")||verified.equals("PE/MZ header")))kind="Recognized executable header";
            signals.add(m("path",path,"kind",kind,"verification",verified,"notes",notice,"tool_ids",ids));
            for(String id:ids){chosen.add(id);reasons.putIfAbsent(id,kind);}
        }
        var cat=arr(Report.resource("tools.json"));var tools=new ArrayList<Object>();
        for(Object t:cat){var original=obj(t);String id=str(original.get("id"));if(chosen.contains(id)){var copy=new LinkedHashMap<String,Object>(original);copy.put("reason",reasons.get(id));tools.add(copy);}}
        return m("signals",signals,"tools",tools,"catalog_size",cat.size());
    }
}
