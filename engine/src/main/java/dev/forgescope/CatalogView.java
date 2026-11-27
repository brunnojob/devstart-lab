package dev.forgescope;
import java.util.*;
import static dev.forgescope.Data.*;
/** Browsable offline RevScope catalog, using pinned tool metadata and source URLs. */
public final class CatalogView {
    private CatalogView(){}
    static String tr(String lang,String en,String pt,String es){return lang.equals("pt-BR")?pt:lang.equals("es")?es:en;}
    public static String label(String lang){return tr(lang,"Tools catalog","Catálogo de ferramentas","Catálogo de herramientas");}
    public static String render(String language){
        String lang=I18n.language(language);
        var groups=new LinkedHashMap<String,List<Object>>();
        try{for(Object x:arr(Report.resource("tools.json"))){var t=obj(x);groups.computeIfAbsent(str(t.get("category")),k->new ArrayList<>()).add(x);}}
        catch(Exception e){throw new IllegalStateException(e);}
        var b=new StringBuilder("<section class=\"catalog card\" id=\"revscope-catalog\"><h2>RevScope · ");
        b.append(html(label(lang))).append("</h2><p>").append(html(tr(lang,
            "Browse the 22 curated tools by category. Each entry includes purpose, learning level and official documentation. No binary analysis or remote scripts run here.",
            "Consulte as 22 ferramentas selecionadas por categoria. Cada item traz objetivo, dificuldade e documentação oficial. Nenhum binário é analisado ou executado.",
            "Consulta las 22 herramientas seleccionadas por categoría. Cada entrada incluye propósito, dificultad y documentación oficial. No se analizan ni ejecutan binarios."))).append("</p>");
        int group=0;
        for(var section:groups.entrySet()){
            b.append("<details class=\"catalog-group\" id=\"catalog-").append(++group).append("\"><summary>").append(html(I18n.text(section.getKey(),lang)))
            .append(" (").append(section.getValue().size()).append(")</summary><div class=\"catalog-grid\">");
            for(Object item:section.getValue()){
                var t=obj(item);b.append("<article class=\"catalog-tool\"><h3><a rel=\"noopener noreferrer\" href=\"").append(html(t.get("url"))).append("\">").append(html(t.get("name"))).append("</a></h3>");
                b.append("<p>").append(html(I18n.text(t.get("summary"),lang))).append("</p>");
                b.append("<p><b>").append(html(I18n.text("Best for",lang))).append(":</b> ").append(html(I18n.text(t.get("bestFor"),lang))).append("</p>");
                b.append("<p class=\"muted\">").append(html(I18n.text("Platform",lang))).append(": ").append(html(t.get("platform"))).append(" · ")
                  .append(html(I18n.text("Level",lang))).append(": ").append(html(I18n.text(t.get("level"),lang))).append(" · ").append(html(I18n.text(t.get("cost"),lang))).append("</p>");
                b.append("<p><a rel=\"noopener noreferrer\" href=\"").append(html(t.get("docs"))).append("\">")
                  .append(html(tr(lang,"Official documentation","Documentação oficial","Documentación oficial"))).append("</a></p></article>");
            }
            b.append("</div></details>");
        }
        return b.append("<p class=\"muted\">").append(html(tr(lang,"External projects remain independent and are never executed by ForgeScope.",
            "Os projetos externos continuam independentes e não são executados pelo ForgeScope.",
            "Los proyectos externos siguen siendo independientes y ForgeScope no los ejecuta."))).append("</p></section>").toString();
    }
}
