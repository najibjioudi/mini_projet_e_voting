package com.evoting.ocr.service;

import com.evoting.ocr.dto.OcrResponse;
import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OcrService {

    @Value("${ocr.tessdata-path}")
    private String tessDataPath;

    @Value("${ocr.language}")
    private String language;

    public OcrResponse processImage(MultipartFile file) throws IOException, TesseractException {
        Tesseract tesseract = new Tesseract();
        tesseract.setDatapath("C:/Users/Najib/Desktop/e_voting_v2/Tess4J/tessdata");
        tesseract.setLanguage("eng");

        BufferedImage image = ImageIO.read(file.getInputStream());
        String result = tesseract.doOCR(image);

        // Simple regex extraction (tunable based on CIN format)
        String cin = extractPattern(result, "\\b[A-Z]{1,2}\\d{4,8}\\b");

        return OcrResponse.builder()
                .extractedText(result)
                .confidence(85.0f)
                .extractedCin(cin)
                .build();
    }

    private String extractPattern(String text, String regex) {
        Pattern pattern = Pattern.compile(regex);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(0);
        }
        return null;
    }
}
