import { writeFile } from "fs/promises";
import { resolve } from "path";
import { $CHAIN_ID, $CONTRACT_LANDS, $CONTRACT_MASTER, $CONTRACT_REGISTRY, $ETH_ADDRESS, $ETH_PRIVATEKEY, $LOGPATH, $PROVIDER_URL, $SSHD_PORT, $SSH_HOST, $SSH_KEY, $SSH_PORT, $SSH_USERNAME } from "./env";
import { MinecraftBridge } from "./lib/bridge";

export const minecraft = new MinecraftBridge({
    privateKey: $ETH_PRIVATEKEY,
    address: $ETH_ADDRESS,
    providerURL: $PROVIDER_URL,
    chainId: $CHAIN_ID,
    gasPrice: 10,

    pools: {
        commonToken: 'obsidian block'
    },

    contracts: {
        master: $CONTRACT_MASTER,
        lands: $CONTRACT_LANDS,
        registry: $CONTRACT_REGISTRY,
        
        uniswapV2Factory: "0x7423C1A9e3cFd70bE50BAF475517f79974864B82",
        uniswapV2Router02: "0x5e2aF046Fe5Aa236a818650bE0Dd57bc661Cd36f"
    },

    host: $SSH_HOST,
    ports: {
        sshd: $SSHD_PORT,
        logs: $SSH_PORT
    },

    username: $SSH_USERNAME,
    logsPath: $LOGPATH,
    sshKey: $SSH_KEY
});


async function main () {
    await minecraft.init();

    
    const tokenlist = await minecraft.generateTokenList([
        "obsidian block",
        "dirt block",
        "gravel block",
        "coal",
        "string",
        "bone",
        "white wool block",
        "cobblestone block",
        "seed"
    ]);

    await writeFile(resolve(__dirname, './data/tokens.json'), JSON.stringify({
        name: "Minecraft Anarchy",
        "logoURI": "https://raw.githubusercontent.com/undrfined/mc-icons/master/pics/2_Grass.png",
        "keywords": [
            "minecraft",
            "defi"
        ],
        "timestamp": new Date().toTimeString(),
        tokens: tokenlist,
        "version": {
            "major": 0,
            "minor": 0,
            "patch": 0
        }
    }, null, 2));
}

main().catch(console.log);

process.on('uncaughtException', function (exc) {
    console.log(exc);
})