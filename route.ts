import type { Hono } from "hono"
import joinImages from 'join-images';
import { ofetch } from "ofetch";
import { type Objekt } from './utils'
import { initBrowser } from "./utils/browser";
import { storage } from "./utils/storage";
import { server } from "./utils/server";

export function registerRoute(app: Hono) {
    // app.get('/objekt-preview/:slug', async (c) => {
    //     const slug = c.req.param('slug')

    //     const cachedImage = await storage.getItemRaw(`${slug}.png`);
    //     if (cachedImage) {
    //         return c.body(cachedImage, 200, {
    //             'Content-Type': 'image/png'
    //         });
    //     }

    //     const objekt = await ofetch<Objekt>(`https://apollo.cafe/api/objekts/by-slug/${slug}`)

    //     const front = await ofetch(objekt.frontImage, {
    //         responseType: 'arrayBuffer'
    //     })

    //     const back = await ofetch(objekt.backImage, {
    //         responseType: 'arrayBuffer'
    //     })

    //     const sharp = await joinImages([front as any, back as any], {
    //         direction: 'horizontal',
    //         color: {
    //             alpha: 0, b: 0, g: 0, r: 0
    //         }
    //     })
    //     const png = sharp.png()
    //     const buffer = await png.toBuffer()

    //     await storage.setItemRaw(`${slug}.png`, buffer);

    //     return c.body(buffer as any, 200, {
    //         'Content-Type': 'image/png'
    //     })
    // })

    app.get('/objekt-preview/:slug', async (c) => {
        const slug = c.req.param('slug')
        const serialNo = c.req.query('serial') || ''

        const cachedImage = await storage.getItemRaw(`${slug}-${serialNo}.png`);
        if (cachedImage) {
            return c.body(cachedImage, 200, {
                'Content-Type': 'image/png'
            });
        }

        const browser = await initBrowser()
        const page = await browser.newPage()
        const response = await page.goto(`${server.url.origin}/objekt-preview-html/${slug}?serial=${serialNo}`)
        if (response.status() === 404) {
            await page.close()
            return c.notFound()
        }
        const buffer = await page.screenshot({ fullPage: true, type: 'png', omitBackground: true, })
        await page.close()

        await storage.setItemRaw(`${slug}-${serialNo}.png`, buffer);

        return c.body(buffer as any, 200, {
            'Content-Type': 'image/png'
        })
    })

    app.get('/objekt-preview-html/:slug', async (c) => {
        const slug = c.req.param('slug')
        const serialNo = c.req.query('serial') || ''

        let objekt;
        try {
            objekt = await ofetch<Objekt>(`https://apollo.cafe/api/objekts/by-slug/${slug}`);
        } catch (error) {
            if (error.response && error.response.status === 404) {
                return c.notFound();
            }
            throw error;
        }

        // replace collectionNo and serialNo with objekt.collectionNo and objekt.serialNo
        const html = await Bun.file(serialNo ? './public/objekt.html' : './public/objekt-noserial.html').text()
        const htmlWithObjekt = html
            .replace('{collectionNo}', objekt.collectionNo)
            .replace('{serialNo}', serialNo?.toString().padStart(5, "0"))
            .replace('{name}', objekt.collectionId)
            .replace('{imageFront}', objekt.frontImage)
            .replace('{imageBack}', objekt.backImage)
            .replace('{background}', objekt.backgroundColor)
            .replace('{text}', objekt.textColor)

        return c.html(htmlWithObjekt)
    })
}