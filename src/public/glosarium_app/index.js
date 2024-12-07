document.addEventListener("alpine:init", () => {
  Alpine.data("glosarium", () => ({
    route: "list",
    glosarium: [],
    glosariumMeaning: [],
    selectedGlosarium: [],
    glosariumPage: 1,
    glosariumPageNav: {
      hasNext: false,
      hasPrev: false,
    },
    search: "",
    copyStatus: 1,
    loadingGetGlosarium: false,
    loadingGetGlosariumMeaning: false,
    loadingSearchGlosarium: false,

    getGlosarium() {
      this.loadingGetGlosarium = true;
      const params = new URLSearchParams();
      params.append("page", this.glosariumPage);
      if (this.search) {
        params.append("word", this.search);
      }
      axios
        .get("/glosarium", { params })
        .then((response) => {
          this.glosarium = response.data.glosarium;
          this.glosariumPageNav = response.data.pagination;
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          this.loadingGetGlosarium = false;
        });
    },

    getGlosariumMeaning() {
      if (!this.selectedGlosarium.length) return;
      this.loadingGetGlosariumMeaning = true;

      const wordIds = this.selectedGlosarium.map((item) => item.id);
      const params = new URLSearchParams();
      params.append("id", wordIds.join(","));

      axios
        .get("/glosarium/meaning", { params })
        .then((response) => {
          this.glosariumMeaning = response.data.glosarium;
        })
        .catch((error) => {
          console.log(error);
        })
        .finally(() => {
          this.loadingGetGlosariumMeaning = false;
        });
    },

    searchGlosarium() {
      this.glosariumPage = 1;
      this.getGlosarium();
    },

    selectWord(word) {
      const index = this.selectedGlosarium.findIndex(
        (item) => item.id === word.id
      );
      if (index !== -1) {
        this.selectedGlosarium.splice(index, 1);
        return;
      }
      this.selectedGlosarium.push(word);
    },

    isWordSelected(wordId) {
      const index = this.selectedGlosarium.findIndex(
        (item) => item.id === wordId
      );
      return index !== -1;
    },

    clearSelectedWord() {
      this.selectedGlosarium = [];
    },

    copyMeaningToClipboard() {
      if (!this.glosariumMeaning.length) return;
      const glosariumText = this.glosariumMeaning
        .map((item) => `${item.word} ${item.meaning}`)
        .join("\n\n");
      navigator.clipboard
        .writeText(glosariumText)
        .then(() => {
          this.copyStatus = 2;
        })
        .catch((error) => {
          console.error(error);
          this.copyStatus = 3;
        })
        .finally(() => {
          setTimeout(() => {
            this.copyStatus = 1;
          }, 1500);
        });
    },

    resetListData() {
      this.glosarium = [];
      this.glosariumMeaning = [];
      this.glosariumPage = 1;
      this.glosariumPageNav = {
        hasNext: false,
        hasPrev: false,
      };
      this.search = "";
    },

    routeToList() {
      this.resetListData();
      this.route = "list";
      this.getGlosarium();
    },

    routeToMeaning() {
      if (!this.selectedGlosarium.length) return;
      this.route = "meaning";
      this.getGlosariumMeaning();
    },

    changePage(changed) {
      this.glosariumPage += changed;
      this.getGlosarium();
    },

    init() {
      this.getGlosarium();
    },
  }));
});
