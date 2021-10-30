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
        
        uniswapV2Factory: "0xc35DADB65012eC5796536bD9864eD8773aBc74C4",
        uniswapV2Router02: "0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506"
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
}

main().catch(console.log);

process.on('uncaughtException', function (exc) {
    console.log(exc);
})