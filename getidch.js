const { Function: Func } = new(require('@neoxr/wb'))

exports.run = {
   usage: ['getidch'],
   use: 'tautan channel',
   category: 'miscs',
   async: async (m, { 
        client,
        args, 
        text, 
        isPrefix, 
        command, 
        Func
         }) => {
        const link = /https:\/\/whatsapp\.com\/channel\/([0-9A-Za-z]*)/i;
        const [_, code] = text.match(link) || [];

        if (!code) {
            return client.reply(m.chat, `• *Contoh :* ${isPrefix + command} https://whatsapp.com/channel/xxxxx`, m);
        }
        await client.sendMessage(m.chat, { react: { text: '🕒', key: m.key }
         }
      );

        try {
            let result = await newsletterInviteInfo(client, code);
            let thumbnailUrl = result.profileUrl;
            result.creation = new Date(result.creation).toISOString().replace('T', ' ').split('.')[0];
            result.subjectTime = new Date(result.subjectTime).toISOString().replace('T', ' ').split('.')[0];
            delete result.profileUrl;

            if (result.settings['[object Promise]']) {
                result.settings = "Kode Reaksi";
            }

            let capt = 'INFORMASI CHANNEL\n\n';
            capt += `ID : ${result.id}\n`;
            capt += `Nama : ${result.subject}\n`;
            capt += `Dibuat Pada : ${result.creation}\n`;
            capt += `Subjek Diubah : ${result.subjectTime}\n`;
            capt += `Pengikut : ${result.followers ? Func.formatter(result.followers) : 'Tidak Diketahui'}\n`;
            capt += `Status : ${result.status}\n`;
            capt += `Pengaturan : ${result.settings}\n`;
            capt += `Verifikasi : ${result.verified}\n`;
            capt += `Deskripsi : ${result.desc}`;

            await client.sendMessage(m.chat, { image: { url: thumbnailUrl }, caption: capt }, { quoted: m });
            await client.sendMessage(m.chat, { react: { text: '', key: m.key } });
        } catch (error) {
            await m.reply(String(error));
            await client.sendMessage(m.chat, { react: { text: '', key: m.key } });
        }
    }
};

async function toUpper(str) {
    return str.toUpperCase();
}


const extractNewsLetter = async (data = {}) => {
    const parseSetting = settings => {
        const entries = Object.entries(settings);
        const transformedSettings = entries.reduce((acc, [key, value]) => {
            acc[toUpper(key.replace(/_/g, ' '))] = typeof value === 'object' ? !!value.value : value;
            return acc;
        }, {});
        return Object.fromEntries(Object.entries(transformedSettings));
    };

    return {
        id: data.id,
        inviteCode: data.thread_metadata.invite,
        subject: data.thread_metadata.name?.text || '',
        subjectTime: Number(data.thread_metadata.name?.update_time / 1000) || 0,
        status: data.state.type || false,
        creation: Number(data.thread_metadata.creation_time * 1000),
        desc: data.thread_metadata.description?.text || '',
        descTime: Number(data.thread_metadata.description?.update_time / 1000) || 0,
        settings: (data.thread_metadata.settings && parseSetting(data.thread_metadata.settings)) || null,
        followers: Number(data.thread_metadata.subscribers_count) || false,
        verified: /verified/i.test(data.thread_metadata.verification) || false,
        profileUrl: data.thread_metadata.picture ? 'https://pps.whatsapp.net' + data.thread_metadata.picture.direct_path : 'https://pps.whatsapp.net' + data.thread_metadata.preview.direct_path || false,
    };
};

async function newsletterInviteInfo(client, code) {
    let payload = {
        variables: {
            input: {
                key: code,
                type: 'INVITE',
                view_role: 'GUEST',
            },
            fetch_viewer_metadata: false,
            fetch_full_image: true,
            fetch_creation_time: true,
        },
    };

    let data = await client.query({
        tag: 'iq',
        attrs: {
            id: client.generateMessageTag(),
            to: '@s.whatsapp.net',
            type: 'get',
            xmlns: 'w:mex',
        },
        content: [
            {
                tag: 'query',
                attrs: {
                    query_id: '6620195908089573',
                },
                content: Buffer.from(JSON.stringify(payload)),
            },
        ],
    });

    let result = JSON.parse(Func.getBinaryNodeChildString(data, 'result'))
    return extractNewsLetter(result.data.xwa2_newsletter);
}
