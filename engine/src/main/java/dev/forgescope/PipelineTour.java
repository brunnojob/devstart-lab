package dev.forgescope;
import java.util.*;
import static dev.forgescope.Data.*;

/** Evidence-backed, fully localized guided tour. Every displayed finding comes from the report. */
public final class PipelineTour {
    private PipelineTour(){}
    static String tr(String lang,String en,String pt,String es){return lang.equals("pt-BR")?pt:lang.equals("es")?es:en;}
    static String title(String lang,int step){
        return switch(step){
            case 1->tr(lang,"PatchScope · Review the change","PatchScope · Revise a alteração","PatchScope · Revisa el cambio");
            case 2->tr(lang,"CIFuse · Diagnose CI and source imports","CIFuse · Investigue CI e imports","CIFuse · Investiga CI e imports");
            case 3->tr(lang,"RepoRelief · Audit maintenance","RepoRelief · Audite a manutenção","RepoRelief · Audita el mantenimiento");
            case 4->tr(lang,"Impact · Trace Java and C# dependencies","Impacto · Rastreie dependências Java e C#","Impacto · Traza dependencias Java y C#");
            case 5->tr(lang,"RevScope · Identify external investigation tools","RevScope · Identifique ferramentas externas","RevScope · Identifica herramientas externas");
            default->tr(lang,"Export · Preserve the evidence","Exportação · Preserve as evidências","Exportación · Conserva las evidencias");
        };
    }
    static String description(String lang,int step){
        return switch(step){
            case 1->tr(lang,"Reads the supplied unified diff. Flags review prompts such as workflow privilege changes and missing tests; no patch is applied.",
                "Lê o diff unificado fornecido. Aponta pontos de revisão, como permissões de workflows e testes; nenhum patch é aplicado.",
                "Lee el diff unificado. Señala aspectos a revisar, como permisos de workflows y pruebas; no aplica parches.");
            case 2->tr(lang,"Groups error patterns from supplied CI logs, records log positions and checks relative JS/TS imports. A diagnostic is not a proven root cause.",
                "Agrupa padrões de falha dos logs de CI, guarda a posição no log e verifica imports relativos JS/TS. O diagnóstico não comprova a causa raiz.",
                "Agrupa patrones de error de los logs de CI, conserva posiciones y revisa imports relativos JS/TS. Un diagnóstico no demuestra la causa raíz.");
            case 3->tr(lang,"Inspects the local source snapshot for missing docs, broken relative Markdown links, missing workflows and conventional test-name gaps.",
                "Inspeciona os arquivos locais em busca de documentação ausente, links Markdown quebrados, workflows e lacunas de nomes de testes.",
                "Inspecciona archivos locales para detectar documentación faltante, enlaces Markdown rotos, workflows y posibles huecos de pruebas.");
            case 4->tr(lang,"Uses the JDK compiler and Roslyn to identify source-level dependency paths and test candidates. Paths show possible reachability, not test coverage.",
                "Usa o compilador JDK e o Roslyn para identificar dependências no código e possíveis testes. Caminhos indicam impacto potencial, não cobertura medida.",
                "Usa el compilador JDK y Roslyn para identificar dependencias y pruebas candidatas. Las rutas indican impacto potencial, no cobertura medida.");
            case 5->tr(lang,"Checks artifact extensions and bounded file headers, then selects matching entries from the pinned RevScope catalog. It never runs binaries or decodes traffic.",
                "Verifica extensões e cabeçalhos limitados de artefatos e recomenda ferramentas do catálogo RevScope. Não executa binários nem decodifica tráfego.",
                "Comprueba extensiones y encabezados limitados y recomienda herramientas del catálogo RevScope. No ejecuta binarios ni decodifica tráfico.");
            default->tr(lang,"The local CLI generates HTML, JSON, SARIF and Markdown from the same findings. Review sensitive snippets before sharing any export.",
                "A CLI local gera HTML, JSON, SARIF e Markdown dos mesmos achados. Revise trechos sensíveis antes de compartilhar arquivos.",
                "La CLI local genera HTML, JSON, SARIF y Markdown de los mismos hallazgos. Revisa fragmentos sensibles antes de compartirlos.");
        };
    }
    static String translateKind(String lang,String kind){
        return switch(kind){
            case "Recognized capture header"->tr(lang,kind,"Cabeçalho de captura identificado","Encabezado de captura reconocido");
            case "Network capture candidate"->tr(lang,kind,"Possível captura de rede","Posible captura de red");
            case "HTTP archive candidate"->tr(lang,kind,"Possível arquivo HTTP","Posible archivo HTTP");
            case "Android package candidate"->tr(lang,kind,"Possível pacote Android","Posible paquete Android");
            case "Recognized executable header"->tr(lang,kind,"Cabeçalho executável identificado","Encabezado ejecutable reconocido");
            case "Executable or library candidate"->tr(lang,kind,"Possível executável ou biblioteca","Posible ejecutable o biblioteca");
            case "Unclassified binary / embedded artifact"->tr(lang,kind,"Binário ou artefato embarcado não classificado","Binario o artefacto integrado no clasificado");
            default->kind;
        };
    }
    static String evidence(Map<String,Object> f,String lang){
        StringBuilder b=new StringBuilder("<article class=\"pipeline-finding\">");
        b.append("<strong>").append(html(I18n.text(f.get("title"),lang))).append("</strong><p><code>").append(html(str(f.get("path")))).append(num(f.get("line"))>0?":"+num(f.get("line")):"").append("</code></p>");
        b.append("<p class=\"muted\">").append(html(I18n.text(f.get("action"),lang))).append("</p>");
        String source=str(f.get("evidence"));if(!source.isBlank())b.append("<details><summary>").append(html(tr(lang,"Source evidence","Evidência original","Evidencia original"))).append("</summary><pre>").append(html(source.length()>300?source.substring(0,300)+"…":source)).append("</pre></details>");
        if(num(f.get("count"))>1)b.append("<p>").append(html(tr(lang,"Occurrences","Ocorrências","Apariciones"))).append(": ").append(num(f.get("count"))).append("</p>");
        return b.append("</article>").toString();
    }
    public static String render(Map<String,Object> report,String language){
        String lang=I18n.language(language);var findings=arr(report.get("findings"));var impact=obj(report.get("impact"));
        var artifacts=report.get("artifacts") instanceof Map<?,?> ? obj(report.get("artifacts")) : m();var signals=arr(artifacts.get("signals"));var tools=arr(report.get("tools"));
        var b=new StringBuilder("<section id=\"pipeline\" class=\"pipeline\" aria-label=\"");
        b.append(html(tr(lang,"Evidence-driven tour","Tour com evidências reais","Recorrido con evidencias reales"))).append("\">");
        b.append("<h2>").append(html(tr(lang,"See what ForgeScope actually finds","Veja o que o ForgeScope realmente encontra","Mira lo que ForgeScope realmente encuentra"))).append("</h2>");
        b.append("<p>").append(html(tr(lang,"Every sample below is read from this report, not a fabricated success score. Pages contains the public fixture; scans of your own project require the local CLI.",
                "Cada exemplo abaixo vem deste relatório, sem pontuação inventada. O Pages usa um projeto de exemplo; para analisar seu repositório, execute a CLI localmente.",
                "Cada ejemplo procede de este informe, sin puntuaciones inventadas. Pages usa un proyecto de ejemplo; para analizar tu repositorio, ejecuta la CLI local."))).append("</p>");
        b.append("<nav class=\"pipeline-index\" aria-label=\"").append(html(tr(lang,"Investigation steps","Etapas da investigação","Pasos de investigación"))).append("\">");
        String[] names={"PatchScope","CIFuse","RepoRelief","Java / C#","RevScope",tr(lang,"Exports","Exportações","Exportaciones")};
        for(int i=0;i<6;i++)b.append("<a class=\"button\" href=\"#pipeline-").append(i+1).append("\">").append(i+1).append(". ").append(names[i]).append("</a>");
        b.append("</nav>");
        for(int i=1;i<=6;i++){
            b.append("<article class=\"pipeline-stage card\" id=\"pipeline-").append(i).append("\" tabindex=\"-1\"><span class=\"eyebrow\">");
            b.append(i).append(" / 6 · ").append(html(tr(lang,"Live report evidence","Evidências deste relatório","Evidencias de este informe"))).append("</span>");
            b.append("<h3>").append(html(title(lang,i))).append("</h3><p>").append(html(description(lang,i))).append("</p>");
            if(i<=3){String eng=names[i-1];int n=0;
                for(Object v:findings){var f=obj(v);if(!str(f.get("engine")).equalsIgnoreCase(eng))continue;n++;if(n<=3)b.append(evidence(f,lang));}
                b.append("<p class=\"muted\">").append(n).append(" ").append(html(tr(lang,"finding(s) in this report","achado(s) neste relatório","hallazgo(s) en este informe"))).append("</p>");
                if(n==0)b.append("<p>").append(html(tr(lang,"No matching findings in this input; this does not prove the repository is clean.","Nenhum achado neste exemplo; isso não prova ausência de problemas.","No hay hallazgos en esta entrada; eso no demuestra ausencia de problemas."))).append("</p>");
            }else if(i==4){
                var affected=arr(impact.get("affected"));var tests=arr(impact.get("test_candidates"));
                b.append("<p>").append(html(tr(lang,"Affected source paths","Caminhos potencialmente afetados","Rutas posiblemente afectadas"))).append(": <strong>").append(affected.size()).append("</strong> · ")
                  .append(html(tr(lang,"Candidate tests","Testes candidatos","Pruebas candidatas"))).append(": <strong>").append(tests.size()).append("</strong></p>");
                for(Object item:affected.stream().limit(3).toList()){var row=obj(item);b.append("<p><code>").append(html(row.get("path"))).append("</code></p>");}
                if(affected.isEmpty())b.append("<p>").append(html(tr(lang,"No changed paths were supplied for impact analysis.","Nenhum arquivo alterado foi informado para análise de impacto.","No se proporcionaron cambios para el análisis de impacto."))).append("</p>");
            }else if(i==5){
                b.append("<p>").append(signals.size()).append(" ").append(html(tr(lang,"artifact signal(s)","sinal(is) de artefatos","señal(es) de artefactos"))).append("</p>");
                for(Object item:signals.stream().limit(3).toList()){var signal=obj(item);b.append("<article class=\"pipeline-finding\"><strong>").append(html(translateKind(lang,str(signal.get("kind"))))).append("</strong><p><code>").append(html(signal.get("path"))).append("</code></p><p>").append(html(I18n.text(signal.get("verification"),lang))).append("</p></article>");}
                for(Object item:tools.stream().limit(3).toList()){var tool=obj(item);b.append("<p><a href=\"").append(html(tool.get("url"))).append("\" rel=\"noopener noreferrer\">").append(html(tool.get("name"))).append("</a> · ").append(html(I18n.text(tool.get("summary"),lang))).append("</p>");}
                if(signals.isEmpty())b.append("<p>").append(html(tr(lang,"No supported artifact type was detected in this scan.","Nenhum tipo de artefato reconhecido nesta análise.","No se detectó ningún tipo de artefacto reconocido."))).append("</p>");
            }else{
                b.append("<p>").append(html(tr(lang,"Export the same local findings in the format your workflow needs:","Exporte os mesmos achados locais no formato necessário:","Exporta los mismos hallazgos locales en el formato que necesites:"))).append("</p>");
                for(String ext:List.of("report.json","report.sarif","report.md","index.html"))b.append("<a class=\"button\" href=\"").append(ext).append("\">").append(ext).append("</a> ");
            }
            b.append("<nav class=\"pipeline-controls\">");
            if(i>1)b.append("<a class=\"button\" href=\"#pipeline-").append(i-1).append("\">").append(html(tr(lang,"Previous","Anterior","Anterior"))).append("</a>");
            b.append("<a class=\"button primary\" href=\"").append(i<6?"#pipeline-"+(i+1):"#pipeline").append("\">")
                .append(html(i<6?tr(lang,"Next stage","Próxima etapa","Siguiente etapa"):tr(lang,"Finish tour","Concluir tour","Finalizar recorrido"))).append("</a>");
            b.append("<a href=\"#pipeline\">").append(html(tr(lang,"Close","Fechar","Cerrar"))).append("</a></nav>");
            b.append("<nav class=\"tour-languages\">").append(I18n.languages(lang,"#pipeline-"+i)).append("</nav></article>");
        }
        return b.append("</section>").toString();
    }
}
