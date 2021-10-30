cd C:\Users\camil\MinecraftOnChain

SET SPIGOT_BIN="C:\MinecraftWorlds\%1\Server\spigot-1.17.1.jar"
SET SERVER_PATH="C:\MinecraftWorlds\%1\Server"

del C:\MinecraftWorlds\%1\Server\eula.txt
echo eula=true>>"C:\MinecraftWorlds\%1\Server\eula.txt"

yarn start