import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

/**
 * Acelera e ajusta a duração de um vídeo para que ele tenha no máximo 10 segundos.
 * 
 * @param {Buffer} inputBuffer - Buffer do vídeo original.
 * @param {number} originalDuration - Duração original do vídeo em segundos.
 * @returns {Promise<Buffer>} - Buffer do vídeo acelerado em formato MP4.
 */
export async function compressVideoDuration(inputBuffer, originalDuration) {
  const targetDuration = 10;

  // Se o vídeo já tiver 10s ou menos, retorna o buffer sem alterar
  if (!originalDuration || originalDuration <= targetDuration) {
    return inputBuffer;
  }

  // Calculo da velocidade (setpts)
  const speedRatio = originalDuration / targetDuration;
  const setptsFactor = (1 / speedRatio).toFixed(4);

  // Caminhos de arquivos temporários
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);
  const outputPath = path.join(tempDir, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

  try {
    // Escreve o buffer original em disco
    await fs.writeFile(inputPath, inputBuffer);

    // Processa o vídeo com FFmpeg
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf setpts=${setptsFactor}*PTS`, // Acelera o vídeo
          '-an',                            // Remove o áudio para otimizar tamanho
          '-t 10',                          // Limita a duração em 10s
          '-c:v libx264',                   // Codec de vídeo
          '-preset ultrafast',              // Veloz na conversão
          '-crf 28'                         // Taxa de compressão
        ])
        .toFormat('mp4')
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Lê o arquivo acelerado para buffer
    const outputBuffer = await fs.readFile(outputPath);
    return outputBuffer;

  } finally {
    // Apaga os arquivos temporários criados no sistema
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
