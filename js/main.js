htmx.on('htmx:wsOpen', function({detail}) {
    detail.socketWrapper.send("Connected","body")
});
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
htmx.on('htmx:wsClose', function(evt) {
    console.log("wsClose",evt)
});
htmx.on('htmx:wsError', function(evt) {
    console.log("wsError",evt)
});
