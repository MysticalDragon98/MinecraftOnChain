import { highlight, warning } from "termx";
import { MinecraftBridge } from ".";
import { minecraft } from "../..";
import { $get, $set } from "../state";
import { verboseLog } from "../verbose";

const log = verboseLog("LANDS");

interface LandData {
    world: string;
    owner: string;
    x: number;
    y: number;
}

export class Land {
    
    constructor (public bridge: MinecraftBridge, public world: string, public x: number, public y: number) {

    }

    async owner () {
        log("Getting owner for", this.toString())
        const owner = await this.bridge.lands.methods.landOwner(this.world, this.x, this.y).call(this.bridge.calldata);

        if (owner === "0x0000000000000000000000000000000000000000") return null;

        return owner;
    }

    async isFree () {
        return await this.owner() === null;
    }

    async create (owner: string) {
        if (!await this.isFree()) throw new Error(`Land (${this.world}, ${this.x}, ${this.y}) is already taken`);

        log("Creating land to", warning(owner), this.toString());
        await this.bridge.lands.methods.createLand(this.world, this.x, this.y, owner).send(this.bridge.senddata);
        this.update();
    }

    async update () {
        log("Updating", this.toString());

        await minecraft.execute(`/world ${this.world}`);
        await minecraft.execute(`/pos1 ${this.x *16},0,${this.y * 16}`);
        await minecraft.execute(`/pos2 ${(this.x+1) * 16 - 1},320,${(this.y+1) * 16 - 1}`);
        await minecraft.execute(`rg delete ${this.regionName}`);
        await minecraft.execute(`rg define ${this.regionName}`);

        const owner = await this.owner();

        if (owner) {
            const user = await minecraft.userByAddress(owner);

            await minecraft.execute(`rg am -w ${this.world} -n ${this.regionName} ${user.name}`);
            user.tell(`Congratulations! You are now the landowner of: ${this.world} { ${this.x}, ${this.y} }`)
        }
    }

    toString () {
        return `${highlight(this.world)} { ${warning(this.x + "")}, ${warning(this.y + "")} }`
    }

    get regionName () {
        return `${this.world}x${this.x < 0? "n" + (this.x * -1): this.x}x${this.y < 0? "n" + (this.y * -1): this.y}`;
    }

    static async setup (bridge: MinecraftBridge) {
        log(`Setting up land updates...`);
        try {
            await Land.loadPastEvents(bridge);
        } catch (exc) {
            log(`Could not setup lands:`, exc);
        }
    }

    static async loadPastEvents (bridge: MinecraftBridge) {

        // const lastBlockNumber = await bridge.web3.eth.getBlockNumber();
        // const lastBlockRead = (lastBlockNumber - $get("lands_lastBlockRead")) > 1000? lastBlockNumber - 999 : $get("lands_lastBlockRead");

        // log(`Reading last events from block ${lastBlockRead}...`);

        // let maxBlockNumber = lastBlockRead;
        // const addressToRefresh = new Set<string>();

        // const createdEvents = await bridge.lands.getPastEvents("LandCreated", {
        //    fromBlock: lastBlockRead
        // });

        // const transferEvents = await bridge.lands.getPastEvents("LandTransferred", {
        //     fromBlock: lastBlockRead
        // });
        
        // for (const { returnValues: evt, blockNumber } of [...createdEvents, ...transferEvents]) {
        //     addressToRefresh.add(`${evt.world} ${evt.x} ${evt.y}`);
        //     if (blockNumber > maxBlockNumber) maxBlockNumber = blockNumber;
        // }

        // for (const addr of Array.from(addressToRefresh)) {
        //     let [ world, cx, cy ] = addr.split(' ');
        //     let x = +cx;
        //     let y = +cy;

        //     const land = new Land(bridge, world, x, y);

        //     await land.update();
        // }

        // await $set("lands_lastBlockRead", maxBlockNumber + 1);

        // setTimeout(() => Land.loadPastEvents(bridge), 60000);
        // await bridge.lands.events.LandCreated(evt => Land.onUpdateEvent(bridge, evt));
        // await bridge.lands.events.LandTransferred(evt=> Land.onUpdateEvent(bridge, evt));
    }

    static async onUpdateEvent (bridge: MinecraftBridge, evt: any) {
        const { returnValues, blockNumber } = evt;

        console.log(evt);
        let maxBlockNumber = $get("lands_lastBlockRead");
        if (maxBlockNumber < blockNumber) await $set("lands_lastBlockRead", blockNumber);

        const land = new Land(bridge, returnValues.world, +returnValues.x, +returnValues.y);

        log("Update received for land:", land.toString());
        await land.update();
    }
}