import './style.css';
import { Map, View } from 'ol';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

//lib yang akan digunakan
import { Vector as VectorSource } from 'ol/source.js';
import VectorLayer from 'ol/layer/Vector';
import GeoJSON from 'ol/format/GeoJSON.js';
import { fromLonLat } from 'ol/proj.js';
import { Icon, Style } from 'ol/style.js';

import Overlay from 'ol/Overlay.js';

// Untuk menampilkan polygon Riau dengan data .json
const riau = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/polygon_riau.json'
  })
});
// end.

// Untuk menampilkan titik banjir dan icon
const banjir = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/banjir.json'
  }),
  style: new Style({
    image: new Icon(({
      anchor: [0.5, 46],
      anchorXUnits: 'flaticon',
      anchorYUnits: 'pixels',
      src: 'icon/flood.png',
      width: 32,
      height: 32
    }))
  })
});
//end

// untuk menampilkan polygon kabupaten/kota di Riau dengan warna gradasi
const kabRiau = new VectorLayer({
  background: '#1a2b39',
  source: new VectorSource({
    url: 'data/kab_riau.json',
    format: new GeoJSON(),
  }),
  style: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'FID'],
      1,
      '#ffff33',
      13,
      '#3358ff',
    ],
  },
});
//end

// checkbox untuk menampilkan/menyembunyikan layer
const polygonLayerCheckbox = document.getElementById('polygon');
const pointLayerCheckbox = document.getElementById('point');

polygonLayerCheckbox.addEventListener('change', function () {
  kabRiau.setVisible(polygonLayerCheckbox.checked);
});

pointLayerCheckbox.addEventListener('change', function () {
  banjir.setVisible(pointLayerCheckbox.checked);
});

// Checkbox induk: seluruh layer survei
document.getElementById('survei').addEventListener('change', function () {
  avenza.setVisible(this.checked);
  document.querySelectorAll('.kat').forEach(function (cb) {
    cb.disabled = !this.checked;     // sub-checkbox dikunci kalau induk mati
  }, this);
});

// Checkbox per kategori
document.querySelectorAll('.kat').forEach(function (cb) {
  cb.addEventListener('change', function () {
    kategoriAktif[cb.value] = cb.checked;
    avenza.changed();                // minta OpenLayers gambar ulang layer avenza
  });
});
//end

// Data lapangan Avenza (walkability)
// 1) Tentukan kategori dari awalan nama titik
function getKategori(nama) {
  const n = nama.toLowerCase().trim();
  if (n.startsWith('halte') || n.startsWith('ht ')) return 'halte';
  if (n.startsWith('zc') || n.startsWith('zb') || n.startsWith('zebra')) return 'zebra';
  if (n.startsWith('tr')) return 'trotoar';
  return 'lainnya';
}

// 2) Siapkan satu style per kategori (dibuat sekali, dipakai berulang)
function buatStyleIcon(file) {
  return new Style({
    image: new Icon({
      anchor: [0.5, 1],
      anchorXUnits: 'fraction',
      anchorYUnits: 'fraction',
      src: 'icon/' + file,
      width: 36,
      height: 36
    })
  });
}

const styleAvenza = {
  halte: buatStyleIcon('halte.png'),
  zebra: buatStyleIcon('zebra.png'),
  trotoar: buatStyleIcon('trotoar.png'),
  lainnya: buatStyleIcon('lainnya.png')
};

const labelKategori = {
  halte: 'Halte',
  zebra: 'Zebra Cross',
  trotoar: 'Trotoar',
  lainnya: 'Lainnya'
};

const kategoriAktif = { halte: true, zebra: true, trotoar: true, lainnya: true };

// 3) Style function: tiap titik "ditanya" kategorinya apa
const avenza = new VectorLayer({
  source: new VectorSource({
    format: new GeoJSON(),
    url: 'data/avenza.json'
  }),
  style: function (feature) {
    const kat = getKategori(feature.get('name'));
    if (!kategoriAktif[kat]) {
      return null;            // kategori dimatiin → titik tidak digambar
    }
    return styleAvenza[kat];
  }
});
//End

const map = new Map({
  target: 'map',
  layers: [
    new TileLayer({
      source: new OSM()
    }), kabRiau, banjir, avenza,  //memanggil variabel data
  ],
  view: new View({
    center: fromLonLat([101.438390, 0.510440]), //lgsg ke riau
    zoom: 2
  })
});

// Zoom otomatis ke data Avenza setelah selesai dimuat
avenza.getSource().on('featuresloadend', function () {
  map.getView().fit(avenza.getSource().getExtent(), {
    padding: [80, 80, 80, 80],
    maxZoom: 17,
    duration: 1000
  });
});

//pop up 2 start (versi P12)
let popupFoto = [];   // foto milik titik yang popup-nya sedang terbuka
let popupNama = '';
const popup = new Overlay({
  element: document.getElementById('popup'),
  positioning: 'top-center',
  stopEvent: false,
  offset: [0, -15],
  autoPan: { animation: { duration: 250 } }
});
map.addOverlay(popup);

map.on('singleclick', function (evt) {
  if (evt.originalEvent.target.closest('.ol-popup')) {
    return;   // klik di dalam popup (foto, tombol ✖) jangan diproses sebagai klik peta
  }
  let layerDiklik = null;
  const feature = map.forEachFeatureAtPixel(evt.pixel, function (feat, layer) {
    layerDiklik = layer;
    return feat;
  }, {
    layerFilter: function (layer) { return layer === banjir || layer === avenza; }
  });

  if (feature) {
    const coordinates = feature.getGeometry().getCoordinates();
    let content = '<h3>Informasi Fitur</h3>';

    if (layerDiklik === avenza) {
      const waktu = feature.get('timestamp').replace('T', ' ').slice(0, 16);
      const kategori = labelKategori[getKategori(feature.get('name'))];
      content += '<p>Nama Titik: <strong>' + feature.get('name') + '</strong></p>' +
        '<p>Kategori: ' + kategori + '</p>' +
        '<p>Waktu survei: ' + waktu + ' WIB</p>';
      const daftarFoto = feature.get('foto') || [];
      if (daftarFoto.length > 0) {
        content += '<div class="foto-survei">';
        daftarFoto.forEach(function (namaFile, i) {
          const src = 'foto/' + encodeURIComponent(namaFile);
          content += '<img src="' + src + '" data-index="' + i + '">';
        });
        popupFoto = daftarFoto;
        popupNama = feature.get('name');
        content += '</div>';
      }
      popup.setOffset([0, -40]);   // pin avenza tingginya 36px
    } else {
      content += '<p>Nama Daerah: <strong>' + feature.get('Nama_Pemetaan') + '</strong></p>' +
        '<p>Jumlah Korban: ' + feature.get('Jumlah_Korban') + '</p>';
      popup.setOffset([0, -15]);
    }

    document.getElementById('popup-content').innerHTML = content;
    popup.setPosition(coordinates);
  } else {
    popup.setPosition(undefined);
  }
});

//Click handler to hide popup
const closer = document.getElementById('popup-closer');
closer.onclick = function () {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};
//End

// Langkah 6: layer highlight + fungsi hover
const featureOverlay = new VectorLayer({
  source: new VectorSource(),
  map: map,
  style: {
    'stroke-color': 'rgba(255, 255, 255, 0.7)',
    'stroke-width': 2,
  },
});

let highlight;

const highlightFeature = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feature) {
    return feature;
  }, {
    layerFilter: function (layer) { return layer === kabRiau; }   // tambahan
  });

  if (feature !== highlight) {
    if (highlight) {
      featureOverlay.getSource().removeFeature(highlight);
    }
    if (feature) {
      featureOverlay.getSource().addFeature(feature);
    }
    highlight = feature;
  }
};

const displayFeatureInfo = function (pixel) {
  const feature = map.forEachFeatureAtPixel(pixel, function (feat) {
    return feat;
  }, {
    layerFilter: function (layer) { return layer === kabRiau; }   // tambahan
  });

  const info = document.getElementById('info');

  if (feature) {
    info.innerHTML = feature.get('Kabupaten') || '&nbsp;';
  } else {
    info.innerHTML = '&nbsp;';
  }
};

// Langkah 7: event gerakan pointer
map.on('pointermove', function (evt) {
  if (evt.dragging) {
    popup.setPosition(undefined);
  }
  const pixel = map.getEventPixel(evt.originalEvent);
  highlightFeature(pixel);
  displayFeatureInfo(pixel);
});

// ===== Modal / lightbox foto survei =====
const modalFoto = new bootstrap.Modal(document.getElementById('modalFoto'));
const modalImg = document.getElementById('modalFotoImg');
const modalJudul = document.getElementById('modalFotoJudul');
const modalHitung = document.getElementById('modalFotoHitung');
const tombolPrev = document.getElementById('fotoPrev');
const tombolNext = document.getElementById('fotoNext');
let fotoAktif = [];
let indexAktif = 0;

function tampilkanFoto(i) {
  indexAktif = (i + fotoAktif.length) % fotoAktif.length;   // muter: setelah terakhir balik ke pertama
  modalImg.src = 'foto/' + encodeURIComponent(fotoAktif[indexAktif]);
  modalHitung.textContent = (indexAktif + 1) + ' / ' + fotoAktif.length;
  const lebihDariSatu = fotoAktif.length > 1;
  tombolPrev.style.display = lebihDariSatu ? '' : 'none';
  tombolNext.style.display = lebihDariSatu ? '' : 'none';
}

document.getElementById('popup-content').addEventListener('click', function (e) {
  const img = e.target.closest('.foto-survei img');
  if (!img) {
    return;
  }
  fotoAktif = popupFoto;
  modalJudul.textContent = popupNama;
  tampilkanFoto(Number(img.dataset.index));
  modalFoto.show();
});

tombolPrev.addEventListener('click', function () { tampilkanFoto(indexAktif - 1); });
tombolNext.addEventListener('click', function () { tampilkanFoto(indexAktif + 1); });

document.addEventListener('keydown', function (e) {
  if (!document.getElementById('modalFoto').classList.contains('show')) {
    return;
  }
  if (e.key === 'ArrowLeft') { tampilkanFoto(indexAktif - 1); }
  if (e.key === 'ArrowRight') { tampilkanFoto(indexAktif + 1); }
});