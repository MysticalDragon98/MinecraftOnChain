import { MinecraftBridge } from ".";

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
        console.log({
            name: this.name,
            address,
            amount: amount.toString()
        })
        return await this.bridge.master.methods.addToken(this.name, address, amount.toString()).send(this.bridge.senddata);
    }

    async burn (address: string, amount: number) {
        return await this.bridge.master.methods.removeToken(this.name, address, amount.toString()).send(this.bridge.senddata);
    }

    async equals (address: string) {
        return address.toLowerCase() === this.address.toLowerCase();
    }

}