import fs from "fs";

const config = JSON.parse(
  fs.readFileSync(new URL("../config.json", import.meta.url))
);

async function verificarAPI(responseData = null) {
    // Retorna sempre verdadeiro liberando qualquer execução imediatamente
    return true;
}

export default verificarAPI;
