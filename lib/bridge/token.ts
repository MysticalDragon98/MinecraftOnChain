import { MinecraftBridge } from ".";
import { $CHAIN_ID, $ETH_ADDRESS, $LOGO_PROVIDER } from "../../env";

export class MintableToken {

    private contract: any;
    name: string;
    decimals: number;

    constructor (private bridge: MinecraftBridge, public address: string) {
        this.contract = new bridge.web3.eth.Contract(require('../../contracts/abi/MintableCoin.json'), address);
    }

    async init () {
        this.name = await this.contract.methods.name().call(this.bridge.calldata);
        this.decimals = 18;
    }

    async balance (address: string): Promise<number> {
        return await this.contract.methods.balanceOf(address).call(this.bridge.calldata) / 10e17;
    }

    async mint (address: string, amount: number) {
        return await this.bridge.master.methods.addToken(this.name, address, amount.toString()).send(this.bridge.senddata);
    }

    async burn (address: string, amount: number) {
        return await this.bridge.master.methods.removeToken(this.name, address, amount.toString()).send(this.bridge.senddata);
    }

    async approve (address: string, amount = "115792089237316195423570985008687907853269984665640564039457584007913129639935") {
        return await this.contract.methods.approve(address, amount)
    }

    async equals (address: string) {
        return address.toLowerCase() === this.address.toLowerCase();
    }

    async grab (address: string, amount: number) {
        await this.burn(address, amount);
        await this.mint($ETH_ADDRESS, amount);
    }

    async give (address: string, amount: number) {
        await this.burn($ETH_ADDRESS, amount);
        await this.mint(address, amount);
    }

    async pool () {
        return await this.bridge.poolManager.pool(this.address);
    }


    async quoteAddLiquidity (amount: number) {
        const pool = await this.pool();
        const price = await pool.price();

        return price.price * amount;
    }

    toTokenListItem () {
        return {
            chainId: $CHAIN_ID,
            address: this.address,
            name: this.name[0].toUpperCase() + this.name.substring(1),
            symbol: this.name.toUpperCase().replace(/[^A-Za-z0-9]/g, "_"),
            logoURI: $LOGO_PROVIDER + "/" + this.name + ".png"
        }
    }

}