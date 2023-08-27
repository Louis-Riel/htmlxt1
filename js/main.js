htmx.on('htmx:wsAfterMessage', function({detail}) {
    if (detail.message.trim()){
        try {
            const json=JSON.parse(detail.message.trim())
            if ((json.origin === "service") && (json.type === "logline")) {
                    const row = document.createElement("tr");
                    row.innerHTML=json.page;
                    document.getElementById("logs")?.appendChild(row);
            }
        } catch(err) {

        }
    }
});
