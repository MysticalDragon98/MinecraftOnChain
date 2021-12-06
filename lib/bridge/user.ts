import { MinecraftBridge } from ".";

export class User {

    constructor (private bridge: MinecraftBridge, public name: string, public address: string) {

    }

    get isRegistered () {
        return this.address !== "0x0000000000000000000000000000000000000000";
    }

    async checkRegistration (teller = this.name) {
        const tellerMsg = teller === this.name ? `You are`: `${this.name} is`;
        if (!this.isRegistered) {
            const tellerUser = await this.bridge.user(teller);
            tellerUser.tell(`${teller}'nt registered yet.`)
        }
    }

    give (item: string, amount: number) {
        this.bridge.execute(`supergive ${this.name} ${item} ${amount}`);
    }

    tell (text: string) {
        this.bridge.execute(`tell ${this.name} ${text}`);
    }

    static async register (bridge: MinecraftBridge, name: string, address: string) {
        await bridge.registry.methods.register(name, address).send(bridge.senddata);
    }

}