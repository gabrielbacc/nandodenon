/**
 * Script para atualizar o HTML da agenda no arquivo index.html
 * Este arquivo deve ser executado sempre que eventos forem adicionados, editados ou removidos
 */

// Função para gerar o HTML da agenda baseado nos eventos atuais
function generateAgendaHtml() {
    // Verificar se o SiteManager existe
    if (typeof SiteManager === 'undefined') {
        console.error('SiteManager não está definido');
        return '<div class="text-agenda-container" data-aos="fade-up">\n' +
               '    <div class="simple-agenda" id="simpleAgendaList">\n' +
               '        <p class="no-events">Erro ao carregar eventos</p>\n' +
               '    </div>\n' +
               '</div>';
    }

    // Obter eventos
    const events = SiteManager.getEvents();
    console.log('Eventos obtidos para agenda:', events ? events.length : 0);
    
    // Ordenar todos os eventos por data
    const sortedEvents = events.sort((a, b) => a.date.localeCompare(b.date));
    
    let agendaHtml = '';
    
    if (sortedEvents.length === 0) {
        agendaHtml = '<div class="text-agenda-container" data-aos="fade-up">\n';
        agendaHtml += '    <div class="simple-agenda" id="simpleAgendaList">\n';
        agendaHtml += '        <p class="no-events">Nenhum evento agendado</p>\n';
        agendaHtml += '    </div>\n';
        agendaHtml += '</div>';
    } else {
        // Agrupar eventos por mês
        const eventsByMonth = {};
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        sortedEvents.forEach(event => {
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
    console.log('Atualizando agenda na página...');
    
    // Atualizar a agenda diretamente no DOM, se estivermos na página index
    const agendaSection = document.querySelector('#agenda .container');
    if (agendaSection) {
        const agendaContainer = agendaSection.querySelector('.text-agenda-container');
        
        // Se o container da agenda existir, substituí-lo
        if (agendaContainer) {
            console.log('Container da agenda encontrado, atualizando...');
            const newAgendaHtml = generateAgendaHtml();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = newAgendaHtml;
            agendaSection.replaceChild(tempDiv.firstElementChild, agendaContainer);
            console.log('Agenda atualizada com sucesso');
        } 
        // Se não existir, inserir após o cabeçalho da seção
        else {
            console.log('Container da agenda não encontrado, criando novo...');
            const sectionHeader = agendaSection.querySelector('.section-header');
            if (sectionHeader) {
                const newAgendaHtml = generateAgendaHtml();
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = newAgendaHtml;
                sectionHeader.insertAdjacentElement('afterend', tempDiv.firstElementChild);
                console.log('Nova agenda inserida com sucesso');
            } else {
                console.error('Cabeçalho da seção agenda não encontrado');
            }
        }
    } else {
        console.log('Seção de agenda não encontrada na página atual');
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

// Também atualizar quando os dados forem inicializados
document.addEventListener('site-data-initialized', function() {
    console.log('Evento site-data-initialized detectado, atualizando agenda na página...');
    updateAgendaInPage();
});

// Garantir que a agenda seja atualizada quando o DOM for carregado
document.addEventListener('DOMContentLoaded', function() {
    // Se o SiteManager já estiver inicializado, atualizar a agenda
    if (typeof SiteManager !== 'undefined') {
        console.log('DOM carregado, verificando eventos e atualizando agenda...');
        // Inicializar SiteManager se necessário
        if (typeof SiteManager.init === 'function') {
            SiteManager.init().then(() => {
                console.log('SiteManager inicializado, atualizando agenda...');
                updateAgendaInPage();
            }).catch(err => {
                console.error('Erro ao inicializar SiteManager:', err);
            });
        } else {
            updateAgendaInPage();
        }
    } else {
        console.warn('SiteManager não encontrado no DOMContentLoaded');
    }
});

// Gerar o HTML quando o script for carregado
console.log('Script update-agenda.js carregado'); 