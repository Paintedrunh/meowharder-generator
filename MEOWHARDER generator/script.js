// --- BAZA DANYCH APLIKACJI (Z KATEGORIAMI) ---
const packData = {
    "HUD": {
        title: "Interfejs (HUD)",
        items: {
            "hotbar": {
                title: "Pasek Szybkiego Wyboru",
                targetPath: "assets/minecraft/textures/gui/sprites/hud/hotbar.png",
                variants: [
                    { id: "lava", name: "Lava Hotbar", src: "images/hotbar/lava.png" },
                    { id: "golden_apple", name: "Golden Apple", src: "images/hotbar/golden_apple.png" }
                ]
            },
            "crosshair": {
                title: "Celownik",
                targetPath: "assets/minecraft/textures/gui/sprites/hud/crosshair.png",
                variants: []
            }
        }
    },
    "GUI": {
        title: "Ekwipunki (GUI)",
        items: {
            "inventory": {
                title: "Ekwipunek Gracza",
                targetPath: "assets/minecraft/textures/gui/container/inventory.png",
                variants: []
            }
        }
    }
};

// --- STAN APLIKACJI ---
let activeCategory = "HUD";
let activeItem = "hotbar";
let selections = {
    "hotbar": "lava"
};

// --- ELEMENTY DOM ---
const menuContainer = document.getElementById('menu-container');
const variantsContainer = document.getElementById('variants-container');
const previewImage = document.getElementById('preview-image');
const previewTitle = document.getElementById('preview-title');

const generateBtn = document.getElementById('generate-btn');
const modalOverlay = document.getElementById('custom-modal');
const closeModalBtn = document.getElementById('close-modal');

// --- INICJALIZACJA ---
function init() {
    renderMenu();
    renderVariants();
    updatePreview();
}

function renderMenu() {
    menuContainer.innerHTML = '';
    
    for (const catKey in packData) {
        const category = packData[catKey];
        
        const header = document.createElement('div');
        header.className = 'category-header';
        header.textContent = category.title;
        menuContainer.appendChild(header);

        for (const itemKey in category.items) {
            const item = category.items[itemKey];
            
            const btn = document.createElement('button');
            btn.className = `mc-btn ${itemKey === activeItem ? 'active' : ''}`;
            btn.textContent = item.title;
            
            btn.onclick = () => {
                activeCategory = catKey;
                activeItem = itemKey;
                renderMenu();
                renderVariants();
                updatePreview();
            };
            menuContainer.appendChild(btn);
        }
    }
}

function renderVariants() {
    variantsContainer.innerHTML = '';
    
    const currentItemData = packData[activeCategory].items[activeItem];
    previewTitle.textContent = "Podgląd: " + currentItemData.title;

    if (currentItemData.variants.length === 0) {
        variantsContainer.innerHTML = '<div style="font-size: 20px; padding: 10px;">Brak dostępnych wariantów dla tego elementu.</div>';
        return;
    }

    currentItemData.variants.forEach(variant => {
        const card = document.createElement('div');
        card.className = `variant-card ${selections[activeItem] === variant.id ? 'selected' : ''}`;
        
        card.innerHTML = `
            <img src="${variant.src}" alt="${variant.name}">
            <div>${variant.name}</div>
        `;
        
        card.onclick = () => {
            selections[activeItem] = variant.id;
            renderVariants();
            updatePreview();
        };
        variantsContainer.appendChild(card);
    });
}

function updatePreview() {
    const selectedVariantId = selections[activeItem];
    const currentItemData = packData[activeCategory].items[activeItem];
    
    if (selectedVariantId && currentItemData) {
        const variant = currentItemData.variants.find(v => v.id === selectedVariantId);
        if (variant) {
            previewImage.src = variant.src;
            previewImage.style.display = "block";
            return;
        }
    }
    previewImage.style.display = "none";
}

// --- LOGIKA OKIENKA (MODAL) ---
closeModalBtn.onclick = () => {
    modalOverlay.style.display = 'none';
};

modalOverlay.onclick = (event) => {
    if (event.target === modalOverlay) {
        modalOverlay.style.display = 'none';
    }
};

// --- GENEROWANIE PACZKI ---
generateBtn.onclick = async () => {
    generateBtn.textContent = "Generowanie...";
    generateBtn.disabled = true;

    try {
        const zip = new JSZip();

        const packName = document.getElementById('pack-name').value || "CustomUI";
        const packDesc = document.getElementById('pack-desc').value || "Wygenerowano";
        const mcmeta = {
            pack: { pack_format: 34, description: packDesc }
        };
        zip.file("pack.mcmeta", JSON.stringify(mcmeta, null, 2));

        for (const selectedItemKey in selections) {
            const variantId = selections[selectedItemKey];
            
            let itemData = null;
            for (const cat in packData) {
                if (packData[cat].items[selectedItemKey]) {
                    itemData = packData[cat].items[selectedItemKey];
                    break;
                }
            }

            if (itemData) {
                const variantData = itemData.variants.find(v => v.id === variantId);
                if (variantData) {
                    const response = await fetch(variantData.src);
                    if (!response.ok) throw new Error(`Brak pliku: ${variantData.src}`);
                    const blob = await response.blob();
                    zip.file(itemData.targetPath, blob);
                }
            }
        }

        const content = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(content);
        link.download = `${packName.replace(/\s+/g, '_')}.zip`;
        link.click();
        URL.revokeObjectURL(link.href);

        modalOverlay.style.display = 'flex';

    } catch (error) {
        alert("Błąd: " + error.message);
        console.error(error);
    } finally {
        generateBtn.textContent = "Wygeneruj Resource Pack";
        generateBtn.disabled = false;
    }
};

init();