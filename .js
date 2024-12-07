const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { token } = require('./config.json'); // config.json 파일에 봇의 토큰을 저장합니다.
const fs = require('fs');
const clientId = '1240283015213617202';



// 랜덤 문자열 생성 함수
const generateRandomCode = (length) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
};

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const commands = [
    {
        name: '경고',
        description: '경고 관련 명령어',
        options: [
            {
                type: 1, // SUB_COMMAND
                name: '부여',
                description: '유저에게 경고를 부여합니다.',
                options: [
                    {
                        type: 6, // USER 타입
                        name: '사람',
                        description: '경고를 부여할 유저',
                        required: true,
                    },
                    {
                        type: 4, // INTEGER 타입
                        name: '개수',
                        description: '부여할 경고 수',
                        required: true,
                    },
                    {
                        type: 3, // STRING 타입
                        name: '사유',
                        description: '경고 사유',
                        required: false,
                    },
                    {
                        type: 3, // STRING 타입
                        name: '코드',
                        description: '일회성 권한 코드',
                        required: false,
                    },
                ],
            },
            {
                type: 1, // SUB_COMMAND
                name: '차감',
                description: '유저의 경고를 차감합니다.',
                options: [
                    {
                        type: 6, // USER 타입
                        name: '사람',
                        description: '경고를 차감할 유저',
                        required: true,
                    },
                    {
                        type: 4, // INTEGER 타입
                        name: '개수',
                        description: '차감할 경고 수',
                        required: true,
                    },
                    {
                        type: 3, // STRING 타입
                        name: '사유',
                        description: '차감 사유',
                        required: false,
                    },
                    {
                        type: 3, // STRING 타입
                        name: '코드',
                        description: '일회성 권한 코드',
                        required: false,
                    },
                ],
            },
            {
                type: 1, // SUB_COMMAND
                name: '확인',
                description: '유저의 경고 수를 확인합니다.',
                options: [
                    {
                        type: 6, // USER 타입
                        name: '유저',
                        description: '경고 수를 확인할 유저',
                        required: false,
                    },
                ],
            },
        ],
    },
    {
        name: '권한코드발급',
        description: '일회성 권한 코드를 발급합니다.',
        options: [
            {
                type: 4, // STRING 타입
                name: '개수',
                description: '발급할 일회성 권한 코드의 수',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '9' }).setToken(token);

(async () => {
    try {
        console.log('슬래시 명령어 등록 중...');

        await rest.put(Routes.applicationCommands(clientId), {
            body: commands,
        });

        console.log('슬래시 명령어 등록 완료!');
    } catch (error) {
        console.error(error);
    }
})();

const warningFilePath = './warnings.json';
const permissionCodesPath = './permission_codes.json'; // 권한 코드를 저장할 파일
const recentActions = new Map(); // 최근 작업을 저장할 Map

// 경고 데이터 초기화
if (!fs.existsSync(warningFilePath)) {
    fs.writeFileSync(warningFilePath, JSON.stringify({}));
}

// 권한 코드 데이터 초기화
if (!fs.existsSync(permissionCodesPath)) {
    fs.writeFileSync(permissionCodesPath, JSON.stringify({}));
}

// 경고 데이터 로드
const loadWarnings = () => {
    const data = fs.readFileSync(warningFilePath);
    return JSON.parse(data);
};

// 권한 코드 데이터 로드
const loadPermissionCodes = () => {
    const data = fs.readFileSync(permissionCodesPath);
    return JSON.parse(data);
};

// 경고 데이터 저장
const saveWarnings = (data) => {
    fs.writeFileSync(warningFilePath, JSON.stringify(data, null, 2));
};

// 권한 코드 데이터 저장
const savePermissionCodes = (data) => {
    fs.writeFileSync(permissionCodesPath, JSON.stringify(data, null, 2));
};

client.once('ready', () => {
    console.log('봇이 준비되었습니다!');
    client.user.setActivity('여러분들을 ', { type: 'WATCHING' }); // 'PLAYING', 'STREAMING', 'LISTENING', 'WATCHING' 중 하나 선택 가능

});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === '경고') {
        const subCommand = options.getSubcommand();
        const permissionCode = options.getString('코드'); // 일회성 권한 코드

        // 권한 코드 데이터 로드
        const permissionCodes = loadPermissionCodes();
        const warnings = loadWarnings();

        if (subCommand === '부여') {
            const user = options.getUser('사람');
            const count = options.getInteger('개수');
            const reason = options.getString('사유') || '사유 없음';
            const userId = user.id;

            // 권한 코드 검증
            if (permissionCode && permissionCodes[permissionCode]) {
                // 코드가 유효하면 권한 부여
                if (!warnings[userId]) {
                    warnings[userId] = [];
                }

                for (let i = 0; i < count; i++) {
                    warnings[userId].push({
                        warncount: 1,
                        reason: reason,
                        time: new Date().toISOString(),
                        canceled: false,
                    });
                }

                saveWarnings(warnings);
                delete permissionCodes[permissionCode]; // 사용된 코드 삭제
                savePermissionCodes(permissionCodes); // 업데이트된 코드 저장
                await interaction.reply(`${user.username}에게 ${count}개의 경고가 부여되었습니다. (사유: ${reason})`);
            } else {
                await interaction.reply('유효하지 않거나 이미 사용된 권한 코드입니다.');
            }
        } else if (subCommand === '차감') {
            const user = options.getUser('사람');
            const count = options.getInteger('개수');
            const reason = options.getString('사유') || '사유 없음';
            const userId = user.id;

            // 권한 코드 검증
            if (permissionCode && permissionCodes[permissionCode]) {
                if (!warnings[userId]) {
                    await interaction.reply('차감할 경고가 없습니다.');
                    return;
                }

                const currentCount = warnings[userId].length;

                if (currentCount < count) {
                    // 모든 경고를 초기화
                    warnings[userId].forEach(warn => {
                        warn.canceled = true; // 모든 경고를 취소 처리
                    });
                    warnings[userId] = []; // 경고 초기화
                    saveWarnings(warnings);
                    delete permissionCodes[permissionCode]; // 사용된 코드 삭제
                    savePermissionCodes(permissionCodes); // 업데이트된 코드 저장

                    await interaction.reply(`${user.username}의 모든 경고가 초기화되었습니다. (총 ${currentCount}개 차감됨)`);
                } else {
                    // 차감할 경고를 제거
                    warnings[userId].splice(0, count);
                    saveWarnings(warnings);
                    delete permissionCodes[permissionCode]; // 사용된 코드 삭제
                    savePermissionCodes(permissionCodes); // 업데이트된 코드 저장

                    await interaction.reply(`${user.username}의 ${count}개의 경고가 차감되었습니다. (사유: ${reason})`);
                }
            } else {
                await interaction.reply('유효하지 않거나 이미 사용된 권한 코드입니다.');
            }
        } else if (subCommand === '확인') {
            const user = options.getUser('유저') || interaction.user;
            const userId = user.id;
            const userWarnings = warnings[userId] || [];

            if (userWarnings.length === 0) {
                await interaction.reply(`${user.username}의 경고 수: 0개`);
            } else {
                const warningList = userWarnings.map((warn, index) => 
                    `경고 ${index + 1}: ${warn.reason} (시간: ${warn.time}) ${warn.canceled ? '(취소됨)' : ''}`).join('\n');
await interaction.reply(`${user.username}의 경고 수: ${userWarnings.length}개\n` + warningList);
}
}
} else if (commandName === '권한코드발급') {
    try{
// 관리자 권한 확인
if (!interaction.member.permissions.has('ADMINISTRATOR')) {
await interaction.reply('이 명령어를 사용하려면 관리자 권한이 필요합니다.');
return;
}
let forcount1 = options.getInteger('개수');
let forcount = forcount1+1
let count = 0;
if (forcount >= 83){
    interaction.reply("너무 믾습니다. 디코 시스템의 한계로 82 개 까지 됩니다")
}
while (count != forcount) {
    count = count + 1
    if (count == forcount) break; // 특정 조건에서 루프를 종료


// 일회성 권한 코드 생성
const newCode = generateRandomCode(8); // 8자리 랜덤 코드 생성
const permissionCodes = loadPermissionCodes();

// 새로운 코드 저장
permissionCodes[newCode] = true; // 코드가 유효함을 표시
savePermissionCodes(permissionCodes);

if (count == 1){
    a =await interaction.reply({content:`발급된 일회성 권한 코드: ${newCode}`})
}else{

// 사용자에게 DM으로 코드 전송
try {
a= await a.edit(`${a.content}\n발급된 일회성 권한 코드: ${newCode}`);
} catch (error) {
console.error('DM 전송 오류:', error);
await interaction.reply('일회성 권한 코드를 DM으로 전송할 수 없습니다. 사용자의 DM 설정을 확인해주세요.');
break
}
}
}
setTimeout(function(){
    a.edit("보안을 위해 가렸어요! 발급한 코드는 사용할 수 있어요")
    
},15000)
}catch(err){
    await interaction.reply("오류!")
    console.error(err)
}}
});

client.login(token);
