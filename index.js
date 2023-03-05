

import { config } from 'dotenv';
import { Client, Message, GatewayIntentBits, Routes } from 'discord.js';
import { REST } from '@discordjs/rest';
import { Random } from 'random';

config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const rest = new REST({ version: '10' }).setToken(TOKEN);

// user inventory
const inventory = new Map();


// User points dictionary
const points = new Map();

// Map of active games
const games = new Map();

client.on('ready', () => {
    console.log(`${client.user.username} has logged in!`);
});

client.on('messageCreate', (message) => {
    console.log(message.content);
    console.log(message.author.tag);
});

let lastInteractionTime = 0;

client.on('interactionCreate', async (interaction) => {
  const currentTime = Date.now();

  if (currentTime - lastInteractionTime < 3000) { // cooldown of 3 seconds (3000 ms)
    return;
  }

  lastInteractionTime = currentTime;

  if (interaction.isCommand()) {
    const { commandName } = interaction;

    if (commandName === 'doaflip') {
      doaflip(interaction);
    } else if (commandName === 'points') {
      getPoints(interaction);
    } else if (commandName === 'guessnumber') {
      guessNumber(interaction);
    } else if (commandName === 'joingame') {
      joinGame(interaction);
    } else if (commandName === 'shop') {
      browseShop(interaction);
    } else if (commandName === 'buy') {
      addItemToInventory(interaction);
    } else if (commandName === 'inventory') {
      viewInventory(interaction);
    } else if (commandName === 'use') {
      useItem(interaction);
    } else if (commandName === 'leaderboard') {
        displayTopUsers(interaction);
      }
  }
});

async function main() {



    const commands = [
        {
            name: 'doaflip',
            description: 'grug attempts to do a flip',
            type: 1 // Set the type to CHAT_INPUT
        },
        {
            name: 'inventory',
            description: 'view your inventory',

            type: 1
        },

        {
            name: 'use',
            description: 'use an item in your inventory',
            type: 1,
            options: [
                {
                    name: 'item',
                    description: 'use an item in your inventory',
                    type: 3,
                    required: true
                }
            ],
        },



        {
            name: 'joingame',
            description: 'Guess a number between 1 and 10',

            type: 1
        },

        {
            name: 'points',
            description: 'check how many points you have',
            type: 1 // Set the type to CHAT_INPUT
        },
        {
            name: 'startgame',
            description: 'Starts the game for the players who joined using /joingame',
            type: 1
        },
        {
            name: 'guessnumber',
            description: 'guess the correct number for points',
            type: 1,
            options: [
                {
                    name: 'number',
                    description: 'The number you are guessing',
                    type: 4, // Change type from string to integer
                    required: true
                }
            ],
        },
        {
            name: 'shop',
            description: 'browse the shop',
            type: 1,

        },
        {
            name: 'leaderboard',
            description: 'see who is ballin',
            type: 1,

        },
        {
            name: 'buy',
            description: 'buy an item from the server market using the corresponding number from /shop',
            type: 1,
            options: [
                {
                    name: 'item',
                    description: 'purchase an item from the market',
                    type: 4, // Change type from string to integer
                    required: true
                }
            ],
        },
    ];

    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Successfully registered application commands.');
    } catch (err) {
        console.error(err);
    }

    await client.login(TOKEN);
}

main();


function browseShop(interaction, addItem, price) {
    let items = ['1. mute', '2. deafen', '3. callout'];
    let prices = [10, 15, 10];
    let itemPrices = '';

    // Create a string of item names and their corresponding prices
    for (let i = 0; i < items.length; i++) {
        itemPrices += `${items[i]} - ${prices[i]} points\n`;
    }

    interaction.reply({
        content: `Currently Available:\n${itemPrices}`,
    });
}

function addItemToInventory(interaction) {
    var itemNum = interaction.options.getInteger('item');
    let prices = [1, 1, 1];
    let items = ['mute', 'deafen', 'callout'];

    // Get the user's current inventory or create an empty one
    const userInventory = inventory.get(interaction.user.id) || new Map();

    const userId = interaction.user.id;
    const userPoints = points.get(userId) || 0;

    // Get the item name and price
    const itemName = items[itemNum - 1]; // Adjust the index to match the items array
    const itemPrice = prices[itemNum - 1]; // Adjust the index to match the prices array

    // Check if the user has enough points to buy the item
    if (userPoints < itemPrice) {
        interaction.reply({
            content: `Sorry, you do not have enough points to buy this item.`,
        });
        return;
    }

    // Subtract the cost of the item from the user's points
    points.set(userId, userPoints - itemPrice);

    // Get the count of the item or set it to 0
    const itemCount = userInventory.get(itemName) || 0;

    // Add the item to the user's inventory
    userInventory.set(itemName, itemCount + 1);

    // Set the user's inventory in the main inventory Map object
    inventory.set(userId, userInventory);

    // Print out the user's current inventory
    let inventoryString = '';
    userInventory.forEach((value, key) => {
        inventoryString += `${key}: ${value}, `;
    });
    inventoryString = inventoryString.slice(0, -2); // remove the last comma and space

    interaction.reply({
        content: `You own: ${inventoryString}`,
    });
}

function viewInventory(interaction) {
    const userInventory = inventory.get(interaction.user.id) || new Map();
    let inventoryString = '';
    userInventory.forEach((value, key) => {
        inventoryString += `${key}: ${value}, `;
    });
    inventoryString = inventoryString.slice(0, -2); // remove the last comma and space

    interaction.reply({
        content: `You own: ${inventoryString}`,
    });





}



function displayTopUsers(interaction) {
    const leaderboard = [];
    // array to store leaderboard entries
    let points = new Map(); // initialize points
    for (const [userId, userPoints] of points.entries()) {
      leaderboard.push({ userId, points: userPoints });
    }
  
    // sort the leaderboard by points in descending order
    leaderboard.sort((a, b) => b.points - a.points);
  
    // construct the leaderboard message
    let message = "**Top 10 Users:**\n";
    for (let i = 0; i < 10 && i < leaderboard.length; i++) {
      const user = interaction.guild.members.cache.get(leaderboard[i].userId);
      message += `${i+1}. ${user.displayName}: ${leaderboard[i].points} points\n`;
    }
  
    // send the leaderboard message
    interaction.reply({
      content: message,
    });
  }







function useDeafenItem(interaction) {
    // Prompt the user to type the name of the user to be deafened
    interaction.reply({
        content: "Please type the name of the user you want to deafen:",
    }).then(() => {
        const filter = (m) => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 10000 });

        collector.on('collect', m => {
            const member = interaction.guild.members.cache.find(member => member.user.tag.toLowerCase() === m.content.toLowerCase());
            if (!member) {
                interaction.followUp({
                    content: `Could not find a user with the name ${m.content}.`,
                });
                return;
            }
            member.voice.setDeaf(true)
                .then(() => {
                    interaction.followUp({
                        content: `User ${member.user.tag} has been deafened.`,
                    });
                })
                .catch(() => {
                    interaction.followUp({
                        content: `Failed to deafen user ${member.user.tag}.`,
                    });
                });
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.followUp({
                    content: 'You did not provide a name within 10 seconds. Command cancelled.',
                });
            }
        });
    });
}






function useMuteItem(interaction) {
    // Prompt the user to type the name of the user to be muted
    interaction.reply({
        content: "Please type the name of the user you want to mute:",
    }).then(() => {
        const filter = (m) => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 10000 });

        collector.on('collect', m => {
            const member = interaction.guild.members.cache.find(member => member.user.tag.toLowerCase() === m.content.toLowerCase());
            if (!member) {
                interaction.followUp({
                    content: `Could not find a user with the name ${m.content}.`,
                });
                return;
            }
            member.voice.setMute(true)
                .then(() => {
                    interaction.followUp({
                        content: `User ${member.user.tag} has been muted.`,
                    });
                })
                .catch(() => {
                    interaction.followUp({
                        content: `Failed to mute user ${member.user.tag}.`,
                    });
                });
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.followUp({
                    content: 'You did not provide a name within 10 seconds. Command cancelled.',
                });
            }
        });
    });
}

function useItem(interaction) {
    const itemName = interaction.options.getString('item');

    // Get the user's inventory
    const userInventory = inventory.get(interaction.user.id);

    // Check if the user has the specified item in their inventory
    const itemCount = userInventory.get(itemName) || 0;
    if (itemCount <= 0) {
        interaction.reply({
            content: `You do not have ${itemName} in your inventory.`,
        });
        return;
    }

    // Use the item
    switch (itemName) {
        case 'mute':
            useMuteItem(interaction);
            break;

        case 'deafen':
            // Do something to deafen the user
            useDeafenItem(interaction);
         
            break;

        case 'callout':
            // Do something to callout the user
            useCalloutItem(interaction);
            break;

        default:
            interaction.reply({
                content: `The ${itemName} item cannot be used.`,
            });
            break;
    }

    // Decrease the item count in the user's inventory
    userInventory.set(itemName, itemCount - 1);

    // Update the user's inventory in the main inventory Map object
    inventory.set(interaction.user.id, userInventory);
}




function useCalloutItem(interaction) {
    
    const possiblecallouts = ["Hey, stop playing like a noob!",
    "Move your a** and take the objective!",
    "Listen up you scrub!",
    "Stop running around aimlessly!",
    "Don't be so pathetic!",
    "You need to step up your game!",
    "Wake up and stop dragging the team down!",
    "Do it right for once, will you?",
    "Quit being a liability to the team!",
    "Get your act together and start fragging!",
    "Can't you hit a shot to save your life?",
    "You're getting wrecked out there!",
    "Stop being a burden to the squad!",
    "Are you even trying or just feeding the enemy?",
    "What's wrong with your aim, seriously?",
    "Don't be a camping sniper, get in the fight!",
    "Level up your skills or get kicked!",
    "Stop blaming the game and start improving!",
    "Don't be such a whiner, it's just a game!",
    "You're not cut out for this, go play something else!"];
    let randomC = Math.floor(Math.random()* possiblecallouts.length);
    let me = interaction.user.tag;

    // Prompt the user to type the name of the user to be called out
    interaction.reply({
        content: "Please type the name of the user you want to call out:",
    }).then(() => {
        const filter = (m) => m.author.id === interaction.user.id;
        const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 10000 });

        collector.on('collect', m => {
            const member = interaction.guild.members.cache.find(member => member.user.tag.toLowerCase() === m.content.toLowerCase());
            if (!member) {
                interaction.followUp({
                    content: `Could not find a user with the name ${m.content}.`,
                });
                return;
            }
            interaction.followUp({
                content: ` @${me} called out @${member.user.tag}\n Grug pitched in and said @${member.user.tag} ${possiblecallouts[randomC]}`,
            });
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                interaction.followUp({
                    content: 'You did not provide a name within 10 seconds. Command cancelled.',
                });
            }
        });
    });
}







function doaflip(interaction) {
    let randomnum = Math.floor(Math.random() * 11);
    if (randomnum > 5) {
        interaction.reply({
            content: 'Grug did not land on his feet :(',
        });
    } else {

        addPoints(interaction.user.id, 1);
        console.log(points.get('367175922706546690'));
        interaction.reply({
            content: 'Grug landed it because Grug is Grug',

        });
    }
}

function getPoints(interaction) {
    const userId = interaction.user.id;
    const userName = interaction.user.tag;
    const userPoints = points.get(userId) || 0;
    interaction.reply({
        content: `${userName} has ${userPoints} points!`,
    });
}
function addPoints(userId, numPoints) {
    const userPoints = points.get(userId) || 0;
    points.set(userId, userPoints + numPoints);
}

function joinGame(interaction) {
    const gameName = interaction.options.getString('name');
    const userId = interaction.user.id;


    let game = games.get(gameName);
    if (!game) {
        // If the game doesn't exist, create a new one
        game = {
            name: gameName,
            host: userId,
            players: [userId],
            state: 'waiting', // Add game state to keep track of waiting or playing
            points: {}
        };
        games.set(gameName, game);
        interaction.reply({
            content: `Created game "${gameName}" with ${game.players.length} player(s).`,
        });
    } else if (game.players.includes(userId)) {
        // If the user is already in the game, let them know
        interaction.reply({
            content: `You're already in game "${gameName}" with ${game.players.length} player(s).`,
        });
    } else if (game.state === 'waiting') { // Only allow joining if game is still waiting for players
        // Otherwise, add the user to the game
        game.players.push(userId);
        games.set(gameName, game);
        interaction.reply({
            content: `Joined game "${gameName}" with ${game.players.length} player(s).`,
        });
        // If there are two players, start the game
        if (game.players.length === 2) {
            game.state = 'playing';
            const number = new Random().int(1, 10);
            game.number = number;
            interaction.channel.send({
                content: `The game has started! use "/guessnumber" to Guess a number between 1 and 10.`
            });
        }
    } else {
        interaction.reply({
            content: `Game "${gameName}" is already in progress.`,
        });
    }
}


async function startGame(gameName) {
    const game = games.get(gameName);
    game.started = true;

    // Generate a random number for the game
    const randomNumber = new Random().int(1, 10);
    game.number = randomNumber;

    // Notify the players that the game has started
    for (const playerId of game.players) {
        const user = await client.users.fetch(playerId);
        user.send(`Game "${gameName}" has started! Guess a number between 1 and 10.`);
    }
}






function guessNumber(interaction) {
    const number = interaction.options.getInteger('number');
    if (number < 1 || number > 10) {
        interaction.reply({
            content: 'Please guess a number between 1 and 10!',
        });
        return;
    }

    let gameId;
    games.forEach((value, key) => {
        if (value.players.includes(interaction.user.id)) { // Check if user is in a game
            gameId = key;
        }
    });

    if (gameId === undefined) {
        interaction.reply({
            content: 'You have not joined a game yet! Use /joingame to join a game.',
        });
        return;
    }

    const game = games.get(gameId);

    if (game.state !== 'playing') {
        interaction.reply({
            content: `Game "${game.name}" is not in progress.`,
        });
        return;
    }

    // Add player to the game
    const playerIndex = game.players.findIndex(player => player === interaction.user.id);
    game.players[playerIndex] = {
        id: interaction.user.id,
        number: number
    };

    // Check if all players have made their guesses
    if (game.players.every(player => player.number !== undefined)) {
        // End game
        let winners = [];
        const winningNumber = game.number;
        game.players.forEach(player => {
            if (player.number === winningNumber) {
                winners.push(player.id);
            }
        });
        if (winners.length > 0) {
            const pointsPerWinner = 5 / winners.length;
            winners.forEach(winnerId => {
                // Give winner 5 points if they guessed the correct number
                if (winnerId === interaction.user.id && winningNumber === number) {
                    addPoints(interaction.user.id, 5);
                }
                addPoints(winnerId, pointsPerWinner);
            });
            interaction.channel.send({
                content: `The winning number was ${winningNumber}! Congratulations to ${winners.map(winnerId => `<@${winnerId}>`)} for winning ${pointsPerWinner} points!`,
            });
        } else {
            interaction.channel.send({
                content: `Nobody guessed the winning number ${winningNumber}. Try again!`,
            });
        }
        // Reset game
        game.players = [];
        game.state = 'waiting';
        game.number = undefined;
        games.set(gameId, game);
    } else {
        interaction.reply({
            content: `Your guess of ${number} has been recorded. Waiting for other players to guess...`,
        });
    }
}
















