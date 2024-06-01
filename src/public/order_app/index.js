window.Telegram.WebApp.ready();

function decodeParam(encoded) {
  const binary = atob(decodeURIComponent(encoded));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return String.fromCharCode(...new Uint16Array(bytes.buffer));
}

document.addEventListener("alpine:init", () => {
  Alpine.data("order", () => ({
    state: "load",
    order: {
      id: "",
      title: "",
    },
    participant: {
      count: 1,
      names: [""],
    },
    user: {
      id: "",
      name: "",
      username: "",
    },
    loadingSubmit: false,
    error: "",
    error_header: "",

    init() {
      if (window.Telegram.WebApp.initDataUnsafe.start_param) {
        const param = decodeParam(
          window.Telegram.WebApp.initDataUnsafe.start_param
        ).split("|");
        this.order.id = parseInt(param[0]);
        this.order.title = param[1];
        this.user.id = window.Telegram.WebApp.initDataUnsafe.user.id || null;
        this.user.name = window.Telegram.WebApp.initDataUnsafe.user
          ? `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name}`.trim()
          : null;
        this.user.username =
          window.Telegram.WebApp.initDataUnsafe.user.username || null;
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        this.order.id = parseInt(urlParams.get("id")) || null;
        this.order.title = urlParams.get("title") || null;
        this.user.id = parseInt(urlParams.get("user_id")) || null;
        this.user.name = urlParams.get("user_name") || null;
        this.user.username = urlParams.get("user_username") || null;
      }

      if (!this.order.id || !this.order.title) {
        this.state = "noid";
      } else {
        this.state = "register";
      }
    },

    addNewParticipant() {
      this.participant.count += 1;
      this.participant.names.push("");
    },

    removeParticipant() {
      if (this.participant.count === 1) return;
      this.participant.count -= 1;
      this.participant.names.pop();
    },

    submit() {
      const filteredParticipant = this.participant.names.filter(
        (item) => !!item
      );
      if (!filteredParticipant.length) {
        this.error_header = "Nama harus diisi";
        return;
      }

      const data = filteredParticipant.map((item) => ({
        value: item,
        order_id: parseInt(this.order.id),
        user_id: parseInt(this.user.id) || null,
        user_name: this.user.name || null,
        user_username: this.user.username || null,
      }));
      console.log(data);

      this.loadingSubmit = true;
      let serverError = false;
      fetch("/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ data }),
      })
        .then((response) => {
          serverError = !response.ok;
          return response.json();
        })
        .then((data) => {
          if (serverError) {
            this.error = data.message;
          } else {
            this.state = "success";
            window.Telegram.WebApp.showAlert(
              "Pendaftaran Berhasil.\nSilahkan tunggu hasil dibagikan",
              () => {
                window.Telegram.WebApp.close();
              }
            );
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          this.error = error.toString();
        })
        .finally(() => {
          this.loadingSubmit = false;
        });
    },
  }));
});
