import { customLog, log, sequencialColor } from "termx";
import { bold } from "chalk";
// import { $VERBOSE_FILTERS } from "../env";

export function verboseLog (name: string) {
    // if($VERBOSE_FILTERS && !$VERBOSE_FILTERS.includes(name)) return (...args: any[]) => {};
    return customLog(sequencialColor(), bold(name));
}