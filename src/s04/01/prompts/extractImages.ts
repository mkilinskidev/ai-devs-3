export const extractImagesPrompt = (): string => {
    const baseURL = `${process.env.CENTRALA_URL}/dane/barbara/`;
    const prompt = `From the provided text, extract all images names and return them as a JSON array.
    Rules:
    1. If there are no images, return an empty array and set the status to EMPTY.
    2. If there are images, return an array with their names and set the status to OK.
    3. If the image name is not a full URL, add the base URL '${baseURL}' to it.

    Output example:
    { "status": "OK, "images": ["image1.jpg", "image2.jpg", "image3.png"] }
    Return only JSON. Go!`;
    return prompt;
}