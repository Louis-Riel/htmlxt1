htmx.on('htmx:wsAfterMessage', function({detail}) {
    const msg = detail.message.trim();
    if (msg && (msg.startsWith("[") || msg.startsWith("{"))){
        try {
            const json=JSON.parse(detail.message.trim())
            if ((json.origin === "service") && (json.type === "logline")) {
                const row = document.createElement("tr");
                const logs = document.getElementById(json.id);
                row.innerHTML=json.page;
                logs.firstElementChild ? 
                    logs.firstElementChild.before(row):
                    logs.appendChild(row);
                logs.firstElementChild.bef = [row,...logs.childNodes];
            } else if (json.eventBase && json.eventId && json.data?.name) {
                Object.entries(json.data)
                      .filter(ent=>!["class","commands","name"].includes(ent[0]))
                      .forEach(ent=>document.getElementsByName(`/Components/${json.data.name}/${ent[0]}`)
                                            .forEach(ctl=>ctl.value=ent[1]))
            }
        } catch(err) {
            console.error(err);
        }
    }
});
