// script.js
// Handlers para mapa interativo e geolocalização

document.addEventListener('DOMContentLoaded', () => {
  const output = createOutputContainer();

  // Handler para cliques nas áreas do mapa
  document.querySelectorAll('map area').forEach(area => {
    // permite foco via teclado
    area.setAttribute('tabindex', '0');
    area.addEventListener('click', (e) => {
      e.preventDefault();
      const name = area.dataset.name || area.title || area.alt || area.id;
      showContinentInfo(name, output);
    });
    area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const name = area.dataset.name || area.title || area.alt || area.id;
        showContinentInfo(name, output);
      }
    });
  });

  // Handler para o botão de geolocalização
  const btn = document.getElementById('getLocation');
  if (btn) {
    btn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showMessage('Geolocalização não suportada pelo navegador.', output, true);
        return;
      }
      showMessage('Obtendo sua localização…', output);
      navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const continent = getContinentFromCoords(latitude, longitude);
        if (continent) {
          showContinentInfo(continent, output, { latitude, longitude });
        } else {
          showMessage('Não foi possível determinar o continente a partir das coordenadas.', output, true);
        }
      }, err => {
        const msg = err.code === 1
          ? 'Permissão negada. Ative o acesso à localização nas configurações do seu navegador.'
          : 'Erro ao obter localização: ' + err.message;
        showMessage(msg, output, true);
      }, { enableHighAccuracy: false, timeout: 10000 });
    });
  }
});

function createOutputContainer() {
  let out = document.getElementById('output');
  if (!out) {
    out = document.createElement('div');
    out.id = 'output';
    out.className = 'output-card';
    out.style.border = '1px solid #ccc';
    out.style.padding = '12px';
    out.style.margin = '12px 0';
    out.style.maxWidth = '720px';
    out.style.background = '#fafafa';
    out.setAttribute('aria-live', 'polite');
    const reference = document.querySelector('p') || document.querySelector('h1');
    reference.insertAdjacentElement('afterend', out);
  }
  return out;
}

function showMessage(text, container, isError = false) {
  container.innerHTML = `<p style="color:${isError ? 'crimson' : '#222'}">${escapeHtml(text)}</p>`;
}

function showContinentInfo(continentName, container, coords) {
  const info = getContinentFacts(continentName);
  let html = `<h2>${escapeHtml(continentName)}</h2>`;
  if (coords) {
    html += `<p><strong>Coordenadas:</strong> ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}</p>`;
  }
  if (info) {
    html += `<p>${escapeHtml(info)}</p>`;
  } else {
    html += `<p>Informações não disponíveis para este continente.</p>`;
  }
  container.innerHTML = html;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

function getContinentFacts(name) {
  const map = {
    'América do Norte': 'Principais características: Montanhas Rochosas, Grandes Lagos, principais rios como Mississippi. Pontos famosos: Grand Canyon, Niagara Falls.',
    'América do Sul': 'Principais características: Floresta Amazônica, Andes, Rio Amazonas. Pontos famosos: Machu Picchu, Cataratas do Iguaçu.',
    'Europa': 'Principais características: Diversidade climática, grandes rios como Danúbio e Reno. Pontos famosos: Alpes, Coliseu, Torre Eiffel.',
    'África': 'Principais características: Desertos (Sahara), rios como Nilo, grandes savanas. Pontos famosos: Kilimanjaro, Delta do Okavango.',
    'Ásia': 'Principais características: A maior massa terrestre, Himalaias (Everest), rios como Yangtzé e Ganges. Pontos famosos: Grande Muralha, Taj Mahal.',
    'Austrália e Oceania': 'Principais características: Placas isoladas, Grande Barreira de Corais, vastas áreas desertas. Pontos famosos: Sydney Opera House, Uluru.'
  };
  return map[name] || null;
}

// Mapeamento simples por bounding boxes (lat, lon)
// Boxes aproximadas (minLat, maxLat, minLon, maxLon)
function getContinentFromCoords(lat, lon) {
  // normaliza longitude para -180..180
  if (lon > 180) lon = ((lon + 180) % 360) - 180;

  const boxes = [
    { name: 'América do Norte', minLat: 7, maxLat: 84, minLon: -168, maxLon: -52 },
    { name: 'América do Sul', minLat: -56, maxLat: 13, minLon: -82, maxLon: -34 },
    { name: 'Europa', minLat: 34, maxLat: 72, minLon: -25, maxLon: 45 },
    { name: 'África', minLat: -35, maxLat: 37, minLon: -18, maxLon: 52 },
    { name: 'Ásia', minLat: -11, maxLat: 81, minLon: 26, maxLon: 180 },
    { name: 'Austrália e Oceania', minLat: -50, maxLat: 0, minLon: 110, maxLon: 180 }
  ];

  for (const b of boxes) {
    if (lat >= b.minLat && lat <= b.maxLat && lon >= b.minLon && lon <= b.maxLon) {
      return b.name;
    }
  }
  // cobertura de ilhas do pacífico e extremos: se não bateu, retornar null
  return null;
}
