export default async function menu(prefix, botName = "MeuBot", userName = "Usuário", {
    header = `*${botName}* • Olá, ${userName}!`,
    bullet = "›",
    divider = "─────────────────"
} = {}) {
    const commands = [
        "menudown",
        "menuadm",
        "menubn",
        "menudono",
        "menumemb",
        "ferramentas",
        "menufig",
        "alteradores",
        "menurpg",
        "menuvip"
    ];

    const list = commands.map(cmd => `${bullet} ${prefix}${cmd}`).join("\n");

    return `${header}\n${divider}\n${list}\n${divider}`;
}
