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

// Função para atualizar dinamicamente a agenda na página atual
function updateAgendaInPage() {
    // Atualizar a agenda diretamente no DOM, se estivermos na página index
    const agendaSection = document.querySelector('#agenda .container');
    if (agendaSection) {
        const agendaContainer = agendaSection.querySelector('.text-agenda-container');
        
        // Se o container da agenda existir, substituí-lo
        if (agendaContainer) {
            const newAgendaHtml = generateAgendaHtml();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newAgendaHtml;
            agendaSection.replaceChild(tempDiv.firstElementChild, agendaContainer);
        } 
        // Se não existir, inserir após o cabeçalho da seção
        else {
            const sectionHeader = agendaSection.querySelector('.section-header');
            if (sectionHeader) {
                const newAgendaHtml = generateAgendaHtml();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newAgendaHtml;
                sectionHeader.insertAdjacentElement('afterend', tempDiv.firstElementChild);
            }
        }
    }
}

// Exportar as funções para uso global
window.generateAgendaHtml = generateAgendaHtml;
window.updateAgendaInPage = updateAgendaInPage;

// Quando o SiteManager emitir o evento de dados atualizados, atualizar a agenda
document.addEventListener('site-data-updated', function() {
    console.log('Evento site-data-updated detectado, atualizando agenda na página...');
    updateAgendaInPage();
});

// Gerar o HTML quando o script for carregado
document.addEventListener('DOMContentLoaded', function() {
    const agendaHtml = generateAgendaHtml();
    console.log('HTML da agenda gerado:');
    console.log(agendaHtml);
    
    // Mostrar instruções
    console.log('------------------------------------------------------');
    console.log('INSTRUÇÕES:');
    console.log('1. A agenda será atualizada automaticamente na página atual.');
    console.log('2. Para exportar o HTML para edição manual do arquivo index.html, utilize o botão "Gerar HTML da Agenda" no painel de administração.');
    console.log('------------------------------------------------------');
    
    // Atualizar a agenda na página atual, se estivermos na página index
    updateAgendaInPage();
}); 