// Kelas dasar abstrak untuk semua item terkait catatan
class NoteItem {
    constructor(id, title, createdAt) {
        // Cek jika kelas ini di-instanisasi langsung, lempar error (karena kelas ini abstrak)
        if (this.constructor === NoteItem) {
            throw new Error("kelas abstrak 'NoteItem' tidak bisa dibuat objek/ instance");
        }
        // Menyimpan id unik untuk catatan, jika tidak ada maka default ke Date.now()
        this.id = id || Date.now();
        // Menyimpan judul catatan
        this.title = title;
        // Menyimpan waktu pembuatan catatan, default saat ini jika tidak disediakan
        this.createdAt = createdAt || new Date().toISOString();
    }

    // methode render abstrak harus diimplementasikan di class turunannya
    render() {
        throw new Error("Method 'render' asbtrak harus diimplementasikan");
    }
}

// Menyimpan waktu pembuatan catatan, default saat ini jika tidak disediakan
class Note extends NoteItem {
    constructor(id, title, content, color = "#ffffff", reminder = null, tags = [], image = null, checklist = []) {
        super(id, title); // Panggil konstruktor superclass (NoteItem)
        this.content = content; // Isi catatan
        this.color = color; // Warna latar belakang catatan
        this.reminder = reminder; // Pengingat untuk catatan (null jika tidak ada)
        this.tags = tags; // Tag terkait catatan
        this.checklist = checklist; // Checklist (array item) untuk catatan
    }

    // Fungsi render untuk menampilkan catatan
    render() {
        const div = document.createElement("div");
        div.className = NotesUI.isListView ? "note bg-white rounded-lg shadow p-4 mb-4" : "note bg-white rounded-lg shadow p-4";
        div.style.backgroundColor = this.color;

        // Fungsi render untuk menampilkan catatan
        const tagsHtml = this.tags ? this.tags.map(tag =>
            `<span class="inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700 mr-1">${tag}</span>`
        ).join("") : "";

        // Fungsi render untuk menampilkan catatan
        const checklistHtml = this.renderChecklist();

        // Definisikan struktur HTML catatan

        // Menetapkan konten innerHTML dari elemen div.innerHTML
        // Judul catatan akan ditempatkan pada bagian h3
        // Konten catatan akan ditempatkan pada bagian p
        // Pada bagian ${this.image ?...} secara kondisional membuat tag img jika properti "this.image" ada 
        // Pada bagian ${checklistHtml} memasukkan konten ceklis yang dihasilkan oleh fungsi renderChecklist()
        // Pada bagian ${this.reminder ? ...} membuat konten jika properti "this.reminder" ada. Menandakan bahwa catatan memiliki pengingat

        div.innerHTML = `
          <h3 class="font-medium mb-2">${this.title}</h3>
          <p class="text-sm text-gray-700 mb-4">${this.content}</p>
          ${this.image ? `<img src="${this.image}" alt="Note image" class="mb-4 max-w-full h-auto">` : ""}
          ${checklistHtml}
          <div class="text-xs text-gray-500 mb-2">${tagsHtml}</div>
          ${this.reminder ? `
            <div class="text-xs text-gray-500 mb-2">
                Reminder: ${new Date(this.reminder).toLocaleString()}
                ${NotesUI.currentView === "reminder" ? `
                    <button onclick="notesManager.removeFromReminder(${this.id})" 
                        class="ml-2 text-gray-600 hover:text-red-500">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </div>
        ` : ""}
          <div class="flex justify-between items-center">
              <span class="text-xs text-gray-500">${new Date(this.createdAt).toLocaleString()}</span>
              <div>
                  ${NotesUI.currentView !== "trash" ? `
                      <button onclick="notesManager.editNote(${this.id})" class="text-gray-600 hover:text-gray-800">
                          <i class="fas fa-edit"></i>
                      </button>
                      <button onclick="notesManager.archiveNote(${this.id})" class="text-gray-600 hover:text-gray-800 ml-2">
                          <i class="fas fa-archive"></i>
                      </button>
                  ` : ""}
                  <button onclick="${NotesUI.currentView === "trash" ? "notesManager.deleteNotePermanently" : "notesManager.deleteNote"}(${this.id})" 
                      class="text-gray-600 hover:text-gray-800 ml-2">
                      <i class="fas fa-trash"></i>
                  </button>
              </div>
          </div>
      `;
        return div;
    }

    // Render checklist (sub-fungsi dalam render untuk item checklist)
    renderChecklist() {
        if (!this.checklist || this.checklist.length === 0) return ""; // no checklist akan mengembalikan nilai string tidak ada

        // Checklist
        return `
          <div class="checklist-items mt-2 space-y-1">
              ${this.checklist.map(item => `
                  <div class="flex items-center space-x-2">
                      <input type="checkbox" 
                          class="form-checkbox h-4 w-4 text-yellow-500" 
                          ${item.checked ? "checked" : ""} 
                          onchange="notesManager.updateNoteChecklist(${this.id}, this)">
                      <span class="checklist-text" style="${item.checked ? "text-decoration: line-through; color: #9CA3AF;" : ""}">${item.text}</span>
                  </div>
              `).join("")}
          </div>
      `;
    }
}

// class interface abstrak storage yang menginmplementasikan abstrak method
class StorageInterface {
    save() { throw new Error("Method 'save' asbtrak harus diimplementasikan"); } // Metode abstract untuk menyimpan data
    load() { throw new Error("Method 'load' asbtrak harus diimplementasikan"); } // Metode abstract untuk memuat data
}

// Implementasi konkret dari penyimpanan lokal menggunakan Local Storage
class LocalStorage extends StorageInterface {
    constructor(key) {
        super();
        this.key = key; // Kunci unik untuk item yang disimpan di localStorage
    }
    // fungsi save data kedalam JSON local storage
    save(data) {
        // Menyimpan data dalam format JSON di localStorage
        localStorage.setItem(this.key, JSON.stringify(data));
    }
    // fungsi load data dari JSON local storage
    load() {
        // Memuat data dari localStorage, parse JSON jika ada, return null jika tidak
        const data = localStorage.getItem(this.key);
        return data ? JSON.parse(data) : null;
    }
}

// Kelas UI Manager untuk mengelola tampilan dan interaksi UI
class NotesUI {
    static isListView = false;              // Menentukan apakah tampilan daftar diaktifkan
    static currentView = "notes";           // Tampilan aktif (bisa berupa "notes", "archive", atau "trash")
    static currentNoteColor = "#ffffff";    // Warna catatan saat ini

    // Daftar pilihan warna untuk catatan
    static colorOptions = [
        { name: "White", value: "#ffffff" },
        { name: "Red", value: "#f28b82" },
        { name: "Orange", value: "#fbbc04" },
        { name: "Yellow", value: "#fff475" },
        { name: "Green", value: "#ccff90" },
        { name: "Teal", value: "#a7ffeb" },
        { name: "Blue", value: "#cbf0f8" },
        { name: "Dark Blue", value: "#aecbfa" },
        { name: "Purple", value: "#d7aefb" },
        { name: "Pink", value: "#fdcfe8" }
    ];

    /*FITUR TOGGLE VIEW NOTE-----------------------------------------------*/
    // Menampilkan view dengan grid 1 dan grid 3 berdasarkan colom
    static toggleView() {
        this.isListView = !this.isListView;
        document.getElementById("view-toggle").className = this.isListView ? "fas fa-list" : "fas fa-th";
        notesManager.updateView();
    }
    /*FITUR TOGGLE VIEW NOTE-----------------------------------------------*/

    /*FITUR SEACRH BAR-----------------------------------------------------*/
    // Inisialisasi fungsionalitas pencarian
    static initSearchFunctionality() {
        const searchInput = document.getElementById("search-input");
        searchInput.addEventListener("input", () => {
            const searchTerm = searchInput.value.toLowerCase();
            notesManager.filterNotes(searchTerm);
        });
    }
    /*FITUR SEACRH BAR-----------------------------------------------------*/

    /*FITUR TOGGLE COLOR------------------------------------------------*/
    // fungsi untuk set color dari color yang ditentukan
    static setNoteColor(color) {
        this.currentNoteColor = color;
        document.getElementById("note-input").style.backgroundColor = color;
    }
    // Menampilkan atau menyembunyikan daftar pilihan warna untuk catatan
    static toggleColorPalette() {
        const palette = document.getElementById("color-palette");
        palette.innerHTML = "";
        this.colorOptions.forEach(color => {
            const colorButton = document.createElement("button");
            colorButton.className = "w-6 h-6 rounded-full";
            colorButton.style.backgroundColor = color.value;
            colorButton.onclick = () => this.setNoteColor(color.value);
            palette.appendChild(colorButton);
        });
        palette.classList.toggle("hidden");
    }
    // inisiasiasi color palet button yang berbentuk lingkaran sesuai warna
    static initColorPalette() {
        const palette = document.getElementById("color-palette");
        this.colorOptions.forEach(color => {
            const colorButton = document.createElement("button");
            colorButton.className = "w-6 h-6 rounded-full";
            colorButton.style.backgroundColor = color.value;
            colorButton.onclick = () => this.setNoteColor(color.value);
            palette.appendChild(colorButton);
        });
    }
    /*FITUR TOGGLE COLOR------------------------------------------------*/

    /*FITUR TOGGLE REMINDER----------------------------------------------*/
    // Menampilkan atau menyembunyikan toogle reminder
    static toggleReminder() {
        document.getElementById("reminder-options").classList.toggle("hidden");
    }
    /*FITUR TOGGLE REMINDER----------------------------------------------*/

    /*FITUR TOGGLE TAGS---------------------------------------------------*/
    // Menampilkan atau menyembunyikan pengaturan tag
    static toggleTags() {
        const tagOptions = document.getElementById("tag-options");
        if (tagOptions.classList.contains("hidden")) {
            // Tampilkan daftar tag yang ada saat membuka tag options
            const tagList = document.createElement("div");
            tagList.className = "mt-2 space-y-1";
            notesManager.tags.forEach(tag => {
                const tagButton = document.createElement("button");
                tagButton.className = "px-2 py-1 bg-gray-200 rounded-full text-sm text-gray-700 mr-1 hover:bg-gray-300";
                tagButton.textContent = tag;
                tagButton.onclick = () => notesManager.addTagToCurrentNote(tag);
                tagList.appendChild(tagButton);
            });
            tagOptions.appendChild(tagList);
        } else {
            // Bersihkan daftar tag saat menutup
            const tagList = tagOptions.querySelector(".space-y-1");
            if (tagList) tagList.remove();
        }
        tagOptions.classList.toggle("hidden");
    }
    /*FITUR TOGGLE REMINDER----------------------------------------------*/
}

// Inisialisasi fungsionalitas untuk memanajemen navigasi dan content
class NotesManager {
    // constructor dari kelas notes manages yang berisi parameter untuk menginisiasi nilai
    constructor() {
        this.notes = []; // Daftar catatan aktif
        this.archivedNotes = []; // Daftar catatan yang diarsipkan
        this.trashedNotes = [];  // Daftar catatan di tempat sampah
        this.tags = []; // Daftar semua tag
        this.reminderNotes = []; // Daftar semua reminder

        // Penyimpanan untuk catatan, arsip, sampah, dan tag menggunakan LocalStorage
        this.notesStorage = new LocalStorage("cakit-notes");
        this.archivedStorage = new LocalStorage("cakit-archived-notes");
        this.trashedStorage = new LocalStorage("cakit-trashed-notes");
        this.tagsStorage = new LocalStorage("cakit-tags");
        this.reminderStorage = new LocalStorage("cakit-reminder-notes");
    }

    /*FITUR NOTE CRUD ----------------------------------------------------*/
    // fungsi menambakan catatan 
    addNote() {
        // inisiasi title, content, reminder date, cheklist, tags
        const title = document.getElementById("note-title").value;
        const content = document.getElementById("note-content").value;
        const reminderDate = document.getElementById("reminder-datetime").value;

        if (title.trim() === "" && content.trim() === "" &&
            !document.querySelector("#checklist-items")?.children.length) return;

        const checklistItems = Array.from(document.querySelector("#checklist-items")?.children || [])
            .map(item => ({
                text: item.querySelector(".checklist-text").textContent,
                checked: item.querySelector(".checklist-checkbox").checked,
            }));

        const tagsContainer = document.querySelector(".note-tags");
        const noteTags = tagsContainer ?
            Array.from(tagsContainer.children).map(span => span.textContent.trim().slice(0, -1)) :
            [];

        // Tambahkan tag baru ke daftar global tags
        noteTags.forEach(tag => {
            if (!this.tags.includes(tag)) {
                this.tags.push(tag);
            }
        });

        const note = new Note(
            Date.now(),
            title,
            content,
            NotesUI.currentNoteColor,
            reminderDate ? new Date(reminderDate).toISOString() : null,
            noteTags,
            document.querySelector("#note-input img")?.src || null,
            checklistItems
        );

        this.notes.unshift(note);

        if (reminderDate) {
            this.reminderNotes.unshift(note);
        }
        this.updateView();
        this.saveNotes();
        this.clearNoteInput();
    }
    //fungsi untuk otomatis menghapus input yang ada di note section
    clearNoteInput() {
        document.getElementById("note-title").value = "";
        document.getElementById("note-content").value = "";
        document.getElementById("reminder-datetime").value = "";
        document.getElementById("tag-input").value = "";
        NotesUI.setNoteColor("#ffffff");

        const checklistContainer = document.getElementById("checklist-container");
        if (checklistContainer) {
            checklistContainer.classList.add("hidden");
            document.getElementById("checklist-items").innerHTML = "";
        }

        const noteInput = document.getElementById("note-input");
        const image = noteInput.querySelector("img");
        if (image) {
            image.remove();
        }
    }
    // fungsi edit note
    editNote(id) {
        const note = this.notes.find(n => n.id === id) ||
            this.archivedNotes.find(n => n.id === id);
        if (note) {
            document.getElementById("note-title").value = note.title;
            document.getElementById("note-content").value = note.content;
            document.getElementById("reminder-datetime").value =
                note.reminder ? new Date(note.reminder).toISOString().slice(0, 16) : "";
            NotesUI.setNoteColor(note.color);

            this.setupChecklistForEdit(note);
            this.setupImageForEdit(note);
            this.deleteNote(id);
        }
    }
    // fungsi delete note
    deleteNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            this.trashedNotes.unshift(this.notes.splice(noteIndex, 1)[0]);
        } else {
            const archivedIndex = this.archivedNotes.findIndex(n => n.id === id);
            if (archivedIndex !== -1) {
                this.trashedNotes.unshift(this.archivedNotes.splice(archivedIndex, 1)[0]);
            }
        }
        this.updateView();
        this.saveAllData();
    }
    // fungsi delete note permanen
    deleteNotePermanently(id) {
        this.trashedNotes = this.trashedNotes.filter(note => note.id !== id);
        this.updateView();
        this.saveTrashedNotes();
    }
    // fungsi untuk menyimpan notes di navigasi notes
    saveNotes() {
        this.notesStorage.save(this.notes);
    }
    //fungsi untuk mengambil/load data di navigasi note
    loadNotes() {
        const savedNotes = this.notesStorage.load();
        if (savedNotes) {
            this.notes = savedNotes.map(note => Object.assign(new Note(), note));
        }
    }
    /*FITUR NOTE CRUD----------------------------------------------------*/

    /*FITUR REMINDER-------------------------------------------------*/
    // Fungsi untuk menambahkan reminder
    addToReminder(noteId) {
        const noteIndex = this.notes.findIndex(n => n.id === noteId);
        if (noteIndex !== -1 && this.notes[noteIndex].reminder) {
            this.reminderNotes.unshift(this.notes[noteIndex]);
            this.updateView();
            this.saveAllData();
        }
    }
    // fungsi untuk meremove reminder
    removeFromReminder(noteId) {
        const index = this.reminderNotes.findIndex(n => n.id === noteId);
        if (index !== -1) {
            this.reminderNotes.splice(index, 1);
            this.updateView();
            this.saveReminders();
        }
    }
    // fungsi save reminder
    saveReminders() {
        this.reminderStorage.save(this.reminderNotes);
    }
    // fungsi buat load reminder
    loadReminders() {
        const savedReminders = this.reminderStorage.load();
        if (savedReminders) {
            this.reminderNotes = savedReminders.map(note => Object.assign(new Note(), note));
        }
    }
    /*FITUR REMINDER------------------------------------------------------*/

    /*FITUR ARSIP----------------------------------------------------*/
    // menambahkan note ke arsip
    archiveNote(id) {
        const noteIndex = this.notes.findIndex(n => n.id === id);
        if (noteIndex !== -1) {
            this.archivedNotes.unshift(this.notes.splice(noteIndex, 1)[0]);
            this.updateView();
            this.saveAllData();
        }
    }
    // untuk menyimpa note di bagian navigasi arsip
    saveArchivedNotes() {
        this.archivedStorage.save(this.archivedNotes);
    }
    // untuk load note di bagian navigasi arsip
    loadArchivedNotes() {
        const savedArchived = this.archivedStorage.load();
        if (savedArchived) {
            this.archivedNotes = savedArchived.map(note => Object.assign(new Note(), note));
        }
    }
    /*FITUR ARSIP----------------------------------------------------*/

    /*FITUR TAG-----------------------------------------------------*/
    // Menambahkan Tag
    addTagToCurrentNote(tag) {
        const noteInput = document.getElementById("note-input");
        const tagsContainer = noteInput.querySelector(".note-tags") || (() => {
            const container = document.createElement("div");
            container.className = "note-tags flex flex-wrap gap-1 mt-2";
            noteInput.insertBefore(container, noteInput.querySelector(".flex.justify-between"));
            return container;
        })();

        if (!Array.from(tagsContainer.children).some(span => span.textContent === tag)) {
            const tagSpan = document.createElement("span");
            tagSpan.className = "inline-block bg-gray-200 rounded-full px-2 py-1 text-xs font-semibold text-gray-700";
            tagSpan.innerHTML = `${tag} <button class="ml-1 text-gray-500 hover:text-red-500" onclick="this.parentElement.remove()">×</button>`;
            tagsContainer.appendChild(tagSpan);
        }
    }
    // menghapus tag
    deleteTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.notes.forEach(note => {
            if (note.tags) {
                note.tags = note.tags.filter(t => t !== tag);
            }
        });
        this.saveTags();
        this.saveNotes();
        if (NotesUI.currentView === "tags") {
            this.renderTags();
        }
    }
    // fungsi untuk menampilkan notes dengan tag di navigasi tags
    showTaggedNotes(tag) {
        const taggedNotes = this.notes.filter(note => note.tags.includes(tag));
        this.renderNotes(taggedNotes);

        // Tambahkan tombol kembali ke daftar tag
        const container = document.getElementById("notes-container");
        const backButton = document.createElement("button");
        backButton.className = "fixed bottom-4 right-4 bg-purple-500 text-white px-4 py-2 rounded-lg shadow hover:bg-purple-600";
        backButton.innerHTML = '<i class="fas fa-tags mr-2"></i>Back to Tags';
        backButton.onclick = () => this.renderTags();
        container.appendChild(backButton);
    }
    // fungsi untuk merender/ membuat container tags untuk ditampilkan di content
    renderTags() {
        const container = document.getElementById("notes-container");
        container.innerHTML = "";
        container.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";

        this.tags.forEach(tag => {
            const tagElement = document.createElement("div");
            tagElement.className = "bg-white rounded-lg shadow p-4";

            // Hitung catatan untuk tag ini
            const taggedNotes = this.notes.filter(note => note.tags.includes(tag));

            tagElement.innerHTML = `
                <div class="flex justify-between items-center mb-4">
                    <span class="text-lg font-medium">${tag}</span>
                    <div>
                        <button onclick="notesManager.showTaggedNotes('${tag}')" 
                            class="text-gray-600 hover:text-blue-500 mr-2">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="notesManager.deleteTag('${tag}')" 
                            class="text-gray-600 hover:text-red-500">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="text-sm text-gray-500">
                    ${taggedNotes.length} note${taggedNotes.length !== 1 ? 's' : ''}
                </div>
            `;
            container.appendChild(tagElement);
        });
    }
    // fungsi untuk menyimpan tags kedalam navigasi tags
    saveTags() {
        this.tagsStorage.save(this.tags);
    }
    // fungsi untuk load data di navigasi tags
    loadTags() {
        const savedTags = this.tagsStorage.load();
        if (savedTags) {
            this.tags = savedTags;
        }
    }

    /*FITUR TAG-----------------------------------------------------*/

    /*FITUR CHECKLIST-----------------------------------------------------*/
    // Fungsi untuk membungkus checkbox dengan teks
    createChecklistContainer() {
        const noteInput = document.getElementById("note-input");
        if (!document.getElementById("checklist-container")) {
            const container = document.createElement("div");
            container.id = "checklist-container";
            container.className = "hidden mt-2";
            container.innerHTML = `
              <div id="checklist-input-group" class="flex items-center mb-2">
                  <input type="text" id="checklist-input" 
                      class="flex-1 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500" 
                      placeholder="Add checklist item">
                  <button onclick="notesManager.addChecklistItem()" 
                      class="ml-4 px-7 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600">
                      Add Item
                  </button>
              </div>
              <div id="checklist-items" class="space-y-2"></div>
          `;
            noteInput.appendChild(container);
        }
    }
    // menampilkan checklist
    toggleChecklist() {
        const container = document.getElementById("checklist-container");
        if (!container) {
            this.createChecklistContainer();
            document.getElementById("checklist-container").classList.remove("hidden");
        } else {
            container.classList.toggle("hidden");
        }
    }
    // menambahkan checklist
    addChecklistItem() {
        const input = document.getElementById("checklist-input");
        const text = input.value.trim();
        if (text) {
            const checklistItems = document.getElementById("checklist-items");
            const itemDiv = document.createElement("div");
            itemDiv.className = "flex items-center space-x-2 p-2 bg-gray-50 rounded";
            itemDiv.innerHTML = `
              <input type="checkbox" class="checklist-checkbox form-checkbox h-4 w-4 text-yellow-500" 
                  onchange="notesManager.toggleChecklistItem(this)">
              <span class="checklist-text">${text}</span>
              <button onclick="notesManager.deleteChecklistItem(this)" class="text-gray-500 hover:text-red-500">
                  <i class="fas fa-times"></i>
              </button>
          `;
            checklistItems.appendChild(itemDiv);
            input.value = "";
        }
    }
    // mengedit checklist
    updateNoteChecklist(noteId, checkbox) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            const textElement = checkbox.nextElementSibling;
            const itemText = textElement.textContent;
            const itemIndex = note.checklist.findIndex(item => item.text === itemText);

            if (itemIndex !== -1) {
                note.checklist[itemIndex].checked = checkbox.checked;
                if (checkbox.checked) {
                    textElement.style.textDecoration = "line-through";
                    textElement.style.color = "#9CA3AF";
                } else {
                    textElement.style.textDecoration = "none";
                    textElement.style.color = "inherit";
                }
                this.saveNotes();
            }
        }
    }
    // fungsi setup/nampilkan checklist untuk di edit
    setupChecklistForEdit(note) {
        if (note.checklist && note.checklist.length > 0) {
            this.createChecklistContainer();
            const container = document.getElementById("checklist-container");
            container.classList.remove("hidden");
            const checklistItems = document.getElementById("checklist-items");
            checklistItems.innerHTML = "";

            note.checklist.forEach(item => {
                const itemDiv = document.createElement("div");
                itemDiv.className = "flex items-center space-x-2 p-2 bg-gray-50 rounded";
                itemDiv.innerHTML = `
                      <input type="checkbox" class="checklist-checkbox form-checkbox h-4 w-4 text-yellow-500" 
                          ${item.checked ? "checked" : ""} onchange="notesManager.toggleChecklistItem(this)">
                      <span class="checklist-text" style="${item.checked ? "text-decoration: line-through; color: #9CA3AF;" : ""}">${item.text}</span>
                      <button onclick="notesManager.deleteChecklistItem(this)" class="text-gray-500 hover:text-red-500">
                          <i class="fas fa-times"></i>
                      </button>
                  `;
                checklistItems.appendChild(itemDiv);
            });
        }
    }
    // fungsi membuat checkbox 
    toggleChecklistItem(checkbox) {
        const textElement = checkbox.nextElementSibling;
        if (checkbox.checked) {
            textElement.style.textDecoration = "line-through";
            textElement.style.color = "#9CA3AF";
        } else {
            textElement.style.textDecoration = "none";
            textElement.style.color = "inherit";
        }
    }
    // fungsi untuk menghapus checkbox
    deleteChecklistItem(button) {
        button.closest("div").remove();
    }
    /*FITUR CHECKLIST-----------------------------------------------------*/

    /*FITUR SEARCH--------------------------------------------------------*/
    // fungsi untuk searchbar
    filterNotes(searchTerm) {
        const notes = this.getCurrentNotes();
        const filteredNotes = notes.filter(note =>
            note.title.toLowerCase().includes(searchTerm) ||
            note.content.toLowerCase().includes(searchTerm) ||
            (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
        );
        this.renderNotes(filteredNotes);
    }
    /*FITUR SEARCH--------------------------------------------------------*/

    /*FITUR MENAMPILKAN HASIL NOTES--------------------------------------------------------*/
    // fungsi untuk megambil notes yang ada di bagian navigasi masing-masing
    getCurrentNotes() {
        switch (NotesUI.currentView) {
            case "notes":
                return this.notes;
            case "archive":
                return this.archivedNotes;
            case "trash":
                return this.trashedNotes;
            case "reminder":  // Tambahkan case baru
                return this.reminderNotes.filter(note => note.reminder && new Date(note.reminder) > new Date());
            default:
                return this.notes;
        }
    }
    // fungsi untuk mengupdate tampilan note berdarakan navigasi masing-masing
    updateView() {
        const notes = this.getCurrentNotes();
        this.renderNotes(notes);
    }
    // fungsi untuk merender hasil catatan yang di add dan mengatur grid colomnya
    renderNotes(notes) {
        const container = document.getElementById("notes-container");
        container.innerHTML = "";
        const gridClass = NotesUI.isListView ? "" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4";
        container.className = gridClass;

        if (notes.length === 0) {
            container.innerHTML = `
              <div class="text-center text-gray-500 py-8">
                  No notes found. Start creating your first note!
              </div>
          `;
            return;
        }

        notes.forEach(note => {
            container.appendChild(note.render());
        });
    }
    /*FITUR MENAMPILKAN HASIL NOTES--------------------------------------------------------*/

    /*FITUR TRASH-----------------------------------------------------------------------*/
    // fungsi untuk menyimpan notes di navigasi trash
    saveTrashedNotes() {
        this.trashedStorage.save(this.trashedNotes);
    }
    // fungsi untuk load data di navigasi trash
    loadTrashedNotes() {
        const savedTrashed = this.trashedStorage.load();
        if (savedTrashed) {
            this.trashedNotes = savedTrashed.map(note => Object.assign(new Note(), note));
        }
    }
    /*FITUR TRASH-----------------------------------------------------------------------*/

    /*FITUR SAVE-------------------------------------------------------------------------*/
    // mengelompokkan save data di semua navigasi
    saveAllData() {
        this.saveNotes();
        this.saveArchivedNotes();
        this.saveTrashedNotes();
        this.saveTags();
        this.saveReminders();
    }
    /*FITUR SAVE-------------------------------------------------------------------------*/


    /*FITUR LOAD-------------------------------------------------------------------------*/
    // mengelompokkan load data semua navigasi
    loadAllData() {
        this.loadNotes();
        this.loadArchivedNotes();
        this.loadTrashedNotes();
        this.loadTags();
        this.loadReminders();
        this.updateView();
    }
    /*FITUR LOAD-------------------------------------------------------------------------*/

    // fungsi untuk memulai/ menginisiasi DOM agar bisa digunakan
    init() {
        this.loadAllData();
        NotesUI.initColorPalette();
        NotesUI.initSearchFunctionality();
    }
}

// Inisiasi aplikasi
const notesManager = new NotesManager(); // instance atau objek dari class notesManager
document.addEventListener("DOMContentLoaded", () => { // akan menginisiasi untuk memanggil method init yang ada di class notesManager
    notesManager.init();
});
