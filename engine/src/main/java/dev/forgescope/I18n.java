package dev.forgescope;

import java.util.*;
import static dev.forgescope.Data.*;

/** Shared presentation catalog, also embedded by the C# workbench. Raw evidence is never rewritten. */
public final class I18n {
    static final Map<String,Object> CATALOG;
    static { try { CATALOG=obj(Report.resource("i18n.json")); } catch(Exception e) { throw new ExceptionInInitializerError(e); } }
    public static String language(String value) {
        return switch(value==null?"":value.toLowerCase(Locale.ROOT)) {case "pt","pt-br"->"pt-BR";case "es","es-es"->"es";default->"en";};
    }
    public static boolean contains(String value) { return CATALOG.containsKey(value); }
    public static String text(Object value,String language) {
        String source=str(value),lang=language(language);
        if(lang.equals("en"))return source;
        Object stored=CATALOG.get(source);
        if(stored instanceof Map<?,?> row && row.containsKey(lang))return str(row.get(lang));
        if(source.matches("\\d+ lines"))return source.replace("lines",lang.equals("es")?"líneas":"linhas");
        return source;
    }
    public static String file(String lang) { return switch(language(lang)){case "pt-BR"->"pt-br.html";case "es"->"es.html";default->"index.html";}; }
    public static final String[] TOUR_TITLES={"Overview","Potential impact","Tests and engines","References and calls","Review the evidence","Know the limits"};
    public static final String[] TOUR_TEXT={
        "Start here: these four counts summarize this report. They describe the supplied example, not a quality or security score.",
        "Follow the paths from changed Java and C# files to their dependents. A path is a lead to investigate, not proof that something broke.",
        "Check the suggested tests and the status of every analyzer. Skipped or unavailable analysis must not be mistaken for a clean result.",
        "Inspect unresolved references and source-resolved calls. File paths, method names and original compiler messages stay unchanged in every language.",
        "Open Evidence & action on a finding to see its context and a suggested next step. Review prompts are not confirmed vulnerabilities.",
        "Read the limitations and compiler diagnostics before drawing conclusions. Export JSON, SARIF or Markdown to continue your investigation."};
    public static String tour(int step,String lang) {
        StringBuilder b=new StringBuilder("<aside class=\"tour\" id=\"tour-"+step+"\" tabindex=\"-1\" aria-label=\""+html(text("Guided demonstration",lang))+"\">");
        b.append("<span class=\"eyebrow\">").append(html(text("Step",lang))).append(" ").append(step).append(" ").append(html(text("of",lang))).append(" 6</span><h2>").append(html(text(TOUR_TITLES[step-1],lang))).append("</h2><p>").append(html(text(TOUR_TEXT[step-1],lang))).append("</p><nav>");
        if(step>1)b.append("<a class=\"button\" href=\"#tour-").append(step-1).append("\">").append(html(text("Previous",lang))).append("</a>");
        b.append("<a class=\"button primary\" href=\"").append(step==6?"#overview":"#tour-"+(step+1)).append("\">").append(html(text(step==6?"Finish tour":"Next",lang))).append("</a><a href=\"#overview\">").append(html(text("Close tour",lang))).append("</a></nav><nav class=\"tour-languages\" aria-label=\"").append(html(text("Language",lang))).append("\">");
        b.append(languages(lang,"#tour-"+step));return b.append("</nav></aside>").toString();
    }
    public static String languages(String lang,String anchor) {
        StringBuilder b=new StringBuilder();String[] ids={"pt-BR","en","es"},labels={"Português (Brasil)","English","Español"};
        for(int i=0;i<ids.length;i++)b.append("<a hreflang=\"").append(ids[i]).append("\" lang=\"").append(ids[i]).append("\" href=\"").append(file(ids[i])).append(anchor).append("\"").append(ids[i].equals(language(lang))?" aria-current=\"page\"":"").append(">").append(labels[i]).append("</a>");
        return b.toString();
    }
}
