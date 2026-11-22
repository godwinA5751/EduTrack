
import { pdfjsLib } from "../../lib/pdfWorker";

function getPdfErrorMessage(error) {
  const errorName = error?.name || "";
  const errorMessage = String(error?.message || "").toLowerCase();

  if (errorName === "PasswordException") {
    const passwordCode = error?.code;

    if (
      passwordCode === pdfjsLib.PasswordResponses?.NEED_PASSWORD
    ) {
      return "This PDF is password-protected. Please unlock it and upload an unprotected copy.";
    }

    if (
      passwordCode === pdfjsLib.PasswordResponses?.INCORRECT_PASSWORD
    ) {
      return "The PDF password is incorrect. Please unlock the document and try again.";
    }

    return "EduTrack cannot open this password-protected PDF. Please upload an unprotected copy.";
  }

  if (errorName === "InvalidPDFException") {
    return "This PDF appears to be corrupted or invalid. Please download a fresh copy and try again.";
  }

  if (errorName === "MissingPDFException") {
    return "The PDF file could not be found or accessed. Please select it again.";
  }

  if (errorName === "UnexpectedResponseException") {
    return "The PDF could not be read correctly. Please download a fresh copy and try again.";
  }

  if (
    errorMessage.includes("password") ||
    errorMessage.includes("encrypted")
  ) {
    return "This PDF may be password-protected. Please unlock it and upload an unprotected copy.";
  }

  if (
    errorMessage.includes("invalid pdf") ||
    errorMessage.includes("corrupt")
  ) {
    return "This PDF appears to be corrupted or invalid. Please download a fresh copy and try again.";
  }

  return "EduTrack could not read this PDF. Please try another copy of the document.";
}

export async function extractPdfText(file) {
  if (!file) {
    throw new Error("Please select a PDF file.");
  }

  const isPdf =
    file.type === "application/pdf" ||
    file.name?.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    throw new Error("Please upload a PDF file.");
  }

  if (file.size === 0) {
    throw new Error("The selected PDF is empty. Please choose another file.");
  }

  let loadingTask;

  try {
    const header = await file.slice(0, 5).arrayBuffer();
    const signature = new TextDecoder().decode(header);

    if (signature !== "%PDF-") {
      throw new Error(
        "The selected file is not a valid PDF document. Please choose a genuine PDF file."
      );
    }

    const arrayBuffer = await file.arrayBuffer();

    loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdf = await loadingTask.promise;

    if (!pdf.numPages) {
      throw new Error("This PDF does not contain any pages.");
    }

    const pages = [];
    let totalTextItems = 0;

    for (
      let pageNumber = 1;
      pageNumber <= pdf.numPages;
      pageNumber++
    ) {
      try {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();

        const items = textContent.items
          .filter(
            (item) =>
              typeof item.str === "string" &&
              item.str.trim().length > 0
          )
          .map((item) => ({
            text: item.str.trim(),
            x: item.transform?.[4] ?? 0,
            y: item.transform?.[5] ?? 0,
            width: item.width ?? 0,
            height: item.height ?? 0,
          }));

        totalTextItems += items.length;

        pages.push({
          pageNumber,
          items,
        });
      } catch {
        throw new Error(
          `EduTrack could not read page ${pageNumber} of your PDF. The document may be damaged. Please try downloading it again.`
        );
      }
    }

    if (totalTextItems === 0) {
      throw new Error(
        "No selectable text was found in this PDF. It may be a scanned or image-only document. Please upload a text-based result PDF."
      );
    }

    return {
      pageCount: pdf.numPages,
      pages,
    };
  } catch (error) {
    if (
      error.message?.startsWith("The selected file") ||
      error.message?.startsWith("The PDF") ||
      error.message?.startsWith("This PDF") ||
      error.message?.startsWith("No selectable text") ||
      error.message?.startsWith("EduTrack could not read page")
    ) {
      throw error;
    }

    throw new Error(getPdfErrorMessage(error));
  } finally {
    if (loadingTask) {
      try {
        await loadingTask.destroy();
      } catch {
        // Ignore cleanup errors.
      }
    }
  }
}
