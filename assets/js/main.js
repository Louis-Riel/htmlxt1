htmx.on('htmx:wsAfterMessage', function({detail}) {
    const msg = detail.message.trim();
    if (msg && (msg.startsWith("[") || msg.startsWith("{"))){
        try {
            const json=JSON.parse(detail.message.trim())
            if (json.eventBase && json.eventId && json.data?.name) {
                Object.entries(json.data)
                      .filter(ent=>!["class","commands","name"].includes(ent[0]))
                      .forEach(ent=>document.getElementsByName(`/status/${json.data.name}/${ent[0]}`)
                                            .forEach(ctl=>ctl.nodeName==="INPUT"?ctl.value=ent[1]:ctl.innerText=ent[1]))
            }
        } catch(err) {
            console.error(err);
        }
    }
});
