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
    participant: [{ id: null, value: "", status: "add" }],
    participantDelId: [],
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
        this.user.id = window.Telegram.WebApp.initDataUnsafe.user.id || null;
        this.user.name = window.Telegram.WebApp.initDataUnsafe.user
          ? `${window.Telegram.WebApp.initDataUnsafe.user.first_name} ${window.Telegram.WebApp.initDataUnsafe.user.last_name}`.trim()
          : null;
        this.user.username =
          window.Telegram.WebApp.initDataUnsafe.user.username || null;
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        this.order.id = parseInt(urlParams.get("id")) || null;
        this.user.id = parseInt(urlParams.get("user_id")) || null;
        this.user.name = urlParams.get("user_name") || null;
        this.user.username = urlParams.get("user_username") || null;
      }

      if (!this.order.id) {
        this.state = "noid";
        return;
      }

      // get order title
      fetch(`/order/${this.order.id}/title`)
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            throw data.error;
          }
          this.order.title = data.title;
          return fetch(`/order/${this.order.id}/list/${this.user.id}`);
        })
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          if (data.error) {
            throw data.error;
          }
          if (data?.length) {
            this.participant = data.map((item) => ({
              id: item.id,
              value: item.value,
              status: null,
            }));
          }
          this.state = "register";
        })
        .catch((error) => {
          console.error(error);
          this.state = "noid";
        });
    },

    addNewParticipant() {
      this.participant.push({ id: null, value: "", status: "add" });
    },

    editParticipant(id) {
      if (!id) return;
      const index = this.participant.findIndex((item) => item.id === id);
      this.participant[index].status = "edit";
    },

    removeParticipant(index) {
      if (this.participant[index].id) {
        this.participantDelId.push(this.participant[index].id);
      }
      this.participant = this.participant.filter((val, i) => i !== index);
    },

    submit() {
      const participantAdd = [];
      const participantEdit = [];
      this.participant.forEach((item) => {
        if (item.status === "add" && item.value) {
          participantAdd.push({
            value: item.value,
            order_id: parseInt(this.order.id),
            user_id: parseInt(this.user.id) || null,
            user_name: this.user.name || null,
            user_username: this.user.username || null,
          });
        }
        if (item.status === "edit" && item.id && item.value) {
          participantEdit.push({ id: item.id, value: item.value });
        }
      });

      if (
        !participantAdd.length &&
        !participantEdit.length &&
        !this.participantDelId
      ) {
        this.error_header = "Tidak ada perubahan data";
        return;
      }

      const data = { add: null, edit: null, destroy: null };
      if (participantAdd.length) {
        data.add = participantAdd;
      }
      if (participantEdit.length) {
        data.edit = participantEdit;
      }
      if (this.participantDelId.length) {
        data.destroy = this.participantDelId;
      }
      console.log(data);

      this.loadingSubmit = true;
      let serverError = false;
      fetch(`/order/${this.order.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
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
