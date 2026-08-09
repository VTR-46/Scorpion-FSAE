
// Inicializa o EmailJS com o Public Key
(function () {
    emailjs.init("GZBt0mJtI3EuSV-f0");
})();

// Configuração dos IDs
const SERVICE_ID = "service_mufgyoxD";
const TEMPLATE_ID = "template_2tq9j6s";

document.getElementById("formMsg").addEventListener("submit", function (event) {
    event.preventDefault(); // Evita o recarregamento da página

    const params = {
        from_name: document.getElementById("nome").value,
        reply_to: document.getElementById("email").value,
        message: document.getElementById("mensagem").value
    };

    emailjs.send(SERVICE_ID, TEMPLATE_ID, params)
        .then(function (response) {
            document.getElementById("status").textContent = "E-mail enviado com sucesso!";
            document.getElementById("status").style.color = "green";
            document.getElementById("contactForm").reset();
        })
        .catch(function (error) {
            document.getElementById("status").textContent = "Erro ao enviar: " + error.text;
            document.getElementById("status").style.color = "red";
        });
});
