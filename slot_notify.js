var axios = require('axios');
const nodemailer = require("nodemailer");
const moment= require('moment');
const lookingForAge = 18; // If you are looking for 45 change the value as per your requirement.
const districtId = '265';
const date = moment().format('DD-MM-YYYY');;
var config = {
    method: 'get',
    url: `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/calendarByDistrict?district_id=${districtId}&date=${date}`,
    headers: {
        'authority': 'cdn-api.co-vin.in',
        'sec-ch-ua': '" Not A;Brand";v="99", "Chromium";v="90", "Google Chrome";v="90"',
        'accept': 'application/json, text/plain, */*',
        'sec-ch-ua-mobile': '?0',
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.212 Safari/537.36'
    }
};

async function sendEmail(finalList) {


    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: '{replace with your Gmail id}', // Your Gmail Account
            pass: '{replace with Gmail password}', // Your Gmail passowrd
        },
    });
    let html = ''
    finalList.forEach(i => {
        Object.keys(i).map(item => {
            html = html + `<div><b>${item}: </b><span>${i[item]}</span></div>`
        })
        html = html + '<div>------------------------------------</div>'
    })
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Fred Foo 👻" <foo@example.com>', // sender address
        to: "aecs71@gmail.com", // list of receivers
        subject: "Found Slots for vaccination", // Subject line
        html: `${html}`, // html body
    });
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}
const findSlots = () => {
    axios(config)
        .then(function (response) {
            const centerData = response.data.centers;
            const sessionsData = centerData.map(i => {
                return { name: i.name, sessions: i.sessions }
            });

            const centerFound = sessionsData.filter(i => {
                const sessionFound = i.sessions.filter(item => {
                    return item.available_capacity && item.min_age_limit == lookingForAge;
                });
                if (sessionFound.length > 0)
                    return true;

                return false;
            });
            if (centerFound.length > 0) {
                console.log("Found");
                const finalCenterList = centerFound.map(i => {
                    return {
                        name: i.name, availableSlots: i.sessions[0].available_capacity, minAgeLimit:
                            i.sessions[0].min_age_limit,
                        availableSlotDose1: i.sessions[0].available_capacity_dose1,
                        availableSlotsDose2: i.sessions[0].available_capacity_dose2
                    }
                });
                sendEmail(finalCenterList).catch(console.error);
            }
        })
        .catch(function (error) {
            console.log(error);
        });
}

findSlots();

setInterval(findSlots,1000*60*5)