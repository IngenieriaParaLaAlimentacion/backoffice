import type { Page } from "@playwright/test";

const GEOREF_ORIGIN = "https://apis.datos.gob.ar";
const GEOREF_PATH = "/georef/api/direcciones";

export async function installGeoref(
  page: Page,
  key: string,
): Promise<{
  formattedAddress: string;
  placeId: string;
  city: string;
  province: string;
}> {
  const streetId = key.replace(/[^a-zA-Z0-9-]/g, "-").slice(-80);
  if (!streetId) throw new Error("A nonempty unique Georef key is required");
  const city = "Ciudad Autónoma de Buenos Aires";
  const province = "Ciudad Autónoma de Buenos Aires";
  const formattedAddress = `Calle E2E ${streetId.slice(-40)} 123, CABA`;
  const placeId = `02:02000:${streetId}:123`;
  await page.route(
    (url) => url.origin === GEOREF_ORIGIN && url.pathname === GEOREF_PATH,
    async (route) => {
      if (route.request().method() !== "GET") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        json: {
          direcciones: [
            {
              nomenclatura: formattedAddress,
              calle: { id: streetId },
              altura: { valor: 123 },
              departamento: { id: "02000" },
              provincia: { id: "02", nombre: province },
              localidad_censal: { nombre: city },
              ubicacion: { lat: -34.6037, lon: -58.3816 },
            },
          ],
        },
      });
    },
  );
  return { formattedAddress, placeId, city, province };
}
