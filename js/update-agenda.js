/**
 * Script para atualizar o HTML da agenda no arquivo index.html
 * Este arquivo deve ser executado sempre que eventos forem adicionados, editados ou removidos
 */

// Função para gerar o HTML da agenda baseado nos eventos atuais
function generateAgendaHtml() {
    // Obter eventos
    const events = SiteManager.getEvents();
    
    // Obter data atual
    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    // Filtrar apenas eventos futuros e ordenar por data
    const upcomingEvents = events
        .filter(event => event.date >= todayFormatted)
        .sort((a, b) => a.date.localeCompare(b.date));
    
    let agendaHtml = '';
    
    if (upcomingEvents.length === 0) {
        agendaHtml = '<div class="text-agenda-container" data-aos="fade-up">\n';
        agendaHtml += '    <div class="simple-agenda" id="simpleAgendaList">\n';
        agendaHtml += '        <p class="no-events">Nenhum evento agendado</p>\n';
        agendaHtml += '    </div>\n';
        agendaHtml += '</div>';
    } else {
        // Agrupar eventos por mês
        const eventsByMonth = {};
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        upcomingEvents.forEach(event => {
            const dateParts = event.date.split('-');
            const monthIndex = parseInt(dateParts[1], 10) - 1;
            const monthYear = `${monthNames[monthIndex]} ${dateParts[0]}`;
            
            if (!eventsByMonth[monthYear]) {
                eventsByMonth[monthYear] = [];
            }
            
            eventsByMonth[monthYear].push(event);
        });
        
        // Gerar HTML
        agendaHtml = '<div class="text-agenda-container" data-aos="fade-up">\n';
        agendaHtml += '    <div class="simple-agenda" id="simpleAgendaList">\n';
        
        for (const monthYear in eventsByMonth) {
            agendaHtml += `        <div class="agenda-month">\n`;
            agendaHtml += `            <h3 class="month-title">${monthYear}</h3>\n`;
            agendaHtml += `            <div class="agenda-events-list">\n`;
            
            eventsByMonth[monthYear].forEach(event => {
                const dateParts = event.date.split('-');
                const day = parseInt(dateParts[2], 10);
                const formattedTime = event.time || '';
                
                agendaHtml += `                <div class="agenda-event-item">\n`;
                agendaHtml += `                    <div class="agenda-day">Dia ${day}</div>\n`;
                agendaHtml += `                    <div class="agenda-details">\n`;
                agendaHtml += `                        <span class="agenda-location">${event.location}</span>\n`;
                agendaHtml += `                        <span class="agenda-separator">|</span>\n`;
                agendaHtml += `                        <span class="agenda-time">${formattedTime}</span>\n`;
                agendaHtml += `                        <span class="agenda-separator">|</span>\n`;
                agendaHtml += `                        <span class="agenda-title">${event.title}</span>\n`;
                agendaHtml += `                    </div>\n`;
                agendaHtml += `                </div>\n`;
            });
            
            agendaHtml += `            </div>\n`;
            agendaHtml += `        </div>\n`;
        }
        
        agendaHtml += '    </div>\n';
        agendaHtml += '</div>';
    }
    
    return agendaHtml;
}

// Exportar a função para uso global
window.generateAgendaHtml = generateAgendaHtml;

// Gerar o HTML quando o script for carregado
document.addEventListener('DOMContentLoaded', function() {
    const agendaHtml = generateAgendaHtml();
    console.log('HTML da agenda gerado:');
    console.log(agendaHtml);
    
    // Mostrar instruções
    console.log('------------------------------------------------------');
    console.log('INSTRUÇÕES:');
    console.log('1. Copie o HTML acima');
    console.log('2. Abra o arquivo index.html');
    console.log('3. Substitua o conteúdo entre as tags <!-- INÍCIO DO CONTEÚDO DA AGENDA - SUBSTITUA TUDO ENTRE ESTAS TAGS QUANDO GERAR NOVO HTML --> e <!-- FIM DO CONTEÚDO DA AGENDA -->');
    console.log('4. Salve o arquivo');
    console.log('------------------------------------------------------');
}); 