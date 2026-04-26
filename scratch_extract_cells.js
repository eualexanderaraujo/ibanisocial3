
import crypto from 'crypto';

const rawData = `Jorge Jr 21 98511-3945	Janielle Souza 21 98615-5451	Emmanuel: Deus conosco	AZUL	Flor de Lotus 21 97358-6389	Não	Sim	2	1	Atualmente, ninguém 	2	
Luis Wendling 21 96489-6337	Saulo 21 99671-5140	Zion	VERDE	Marluce Rodrigues 21 96489-7562	Sim	Sim	2	3	1	1	
ARINEA QUINTANILHA 	CARLOS - 979757079	AMOR E MILAGRES	VERDE	VANESSA E  FAMILIA -' 992295761	Sim	Sim	02 e 01 adolescente 	Nemhima	Nenhuma (devido a esposa desempregada e esposo problemas de saude)	02	
Alex 21994403599	Ronaldo +55 21 97632-9267	Porta aberta	VERMELHA	Adilson +55 21 99505‑6673	Sim	Sim	2 adultos 	Nao	Ninguém 	2	
Míriam Gonçalves de Lima Ferreira 	Pr. Milton Barros 	Conexão 	VERMELHA	Michelle Moretti 	Sim	Sim	Mãe e duas filhas  1 jovem estudando 1 adolescente 	0	0	2	
Leonardo Lima de Oliveira  21980338899	Fabiano de Souza 21 98868-8630	Morada 	AZUL	Leonardo Alexandrino	Sim	Sim	2	1	1	1	
Miriam :: 98281-6716		conexão 	VERDE	Valdineia Barbosa da Silva	Não	Não	2	2	0	2	
Mara Lucia de Castro Faber dos Santos @	@Miriam Ferreira (21)98201-6716 /Pr.Milton	Esperança	VERMELHA	Eliane Moreira 	Não	Sim	1	1	Desempregada	1	
Romildo 	Romildo	Vivendo milagres	VERDE	Eni Vinilce	Sim	Sim	2	Nenhuma	Uma aposentada	1 pessoa	
Romildo	Romildo	Vivendo milagres	VERDE	Pratricia Bruno	Não	Sim	2	2	Nenhuma	Um e um esta preso	
Ana Beatriz Trigo +55 21 96998-3311	Vanessa +55 21 98906-8327	Lugares Altos 	BRANCA	Gabryelle 21980806793	Sim	Sim	1	Sim	1	1	
Marcelo Ramos de Santana (21) 988670309	Luciano Oliveira (21) 97209-8953	Conectados com Deus 	BRANCA	Tatiane Alves +55 21 99254-3008	Sim	Sim	1	0	0	1 - Está com o auxílio suspenso 	
Claudia Lourenço 21993640431	Viviane Amorim 21964335354	influenciadores do Amor 	VERMELHA	Danielle Corriça	Sim	Sim	2 (1 adulto e 1 adolescente) 	0	Ninguém 	2	
Mariah +55 21 99056-1537	Luana Campos +55 21 98156-5414	Life Saver	ROXA	Nelcy +55 98 98198-5808	Não	Não	2	1	Nenhuma 	2	
Ângelo Romualdo 21985425637	Fabiano	Tempo de recomeçar 	AZUL	Ângelo Romualdo da Costa Filho 	Sim	Sim	2	1	Vivemos de bico 	2	
Leandro Lima - 21 966213544	Pr. Fabiano Souza - 21 98868-8630	GE Recomeços	AZUL	Guilherme Emiliano Quaresma 	Não	Sim	Dois adultos e duas crianças 	Duas 	Uma pessoa	Uma pessoa 	
Leonardo Lima de Oliveira 21980338899	Fabiano Souza  21 98868-8630	Morada	AZUL	Jairo Barbosa  21 97468-7978	Não	Sim	2	0	0	2	
Nathalia Nascimento 21974493493	Nathalia Nascimento 21974493493	Resplandecer 	VERMELHA	Salomão 21970246092	Não	Sim	2	3	0	2	
Marcus José 21976582421	Saulo 21 98272-7064	Elyon 	VERDE	Tereza Cristina Alves Ferreira Moraes 21 98070-8245	Sim	Sim	3	0	1	2	
Natassia 21981447100	Natassia 	Lar de Milagres 	LARANJA	Keit Darley 	Sim	Sim	2	2	Nenhuma 	2 adultos 	
Diogo 2199328-0496		Chamados para restaurar 	AZUL	Maria Soares	Não	Não	Somente ela	0	Ninguém, ela recebe aposentadoria salário mínimo 	Nenhum	
Paloma 21 98825-5795 	Samuel 21 99917-1524	Transformação e vida 	VERMELHA	Cristina da Silva Lima Carvalho 21 99460-3951	Sim	Sim	2	1	1	1	
Paloma 21 98825-5795 	Samuel  21 99917-1524	Transformação e vida 	VERMELHA	Priscilla Vitorino Pereira 21 98667-7612	Sim	Sim	2	2	1	0	
Edmar Peluchi 21965422426	Leonardo 2198033-2226	Rio de Vida 	AZUL	Rosa Maria de Souza Costa Ribeiro 	Sim	Sim	4	0	1	3	
Natassia	Daniele	Lar de milagres	LARANJA	Sandra 21982994797	Não	Não	3	2	1	2	
Natassia	Daniele	Lar de milagres	LARANJA	Caroline Cristina Santos lopes	Não	Não	5	0	1	2	
Adriano Basílio 	Adriano 	Ágape 	AMARELA	José Ricardo dos Santos Santana 	Sim	Sim	1	1	Afastado 	01	
Adriano Basílio 	Adriano Basílio 	Agape	AMARELA	Julio Cezar da Silva Nascimento 	Sim	Sim	1	1	Só ele e no Momento desempregado 	Um o filho e Estudante 	
Michel ,+55 21997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Joana darc  +55 21991394972	Não	Sim	2	1	0	2	
Michel +5521997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Aparecido Vicente  21993169343	Sim	Sim	2	1	0	2	
Michel +5521997868813	Nathalia +55 21 97449-3493	Mensageiros 	VERMELHA	Kauane Sampaio  +5521974691818	Sim	Sim	2	2	0	2	
Guatavo Angelo	André Toledo 	Revival Flame	AMARELA	Gustavo 21969681443	Sim	Sim	2	2	0	2	
Aline/21993576516	Wellignton/21 99727-1918	Paz e Recomeços 	VERMELHA	Carmen Lúcia da Silva Cruz 	Não	Sim	1	0	0	0	
Camilla Raffaely 21991112626	Luciano Oliveira 21 972098953	Floresça 	BRANCA	Monique Simor 21 994629719	Não	Sim	1	2	0	1	
Luis 21 96489-6337	Saulo	Zion	VERDE	Marluce Rodrigues	Sim	Sim	2	3	1	1	
Alessandra Martins 21 964517098	Denize Costa 	Vida em vidas 	VERMELHA	Magda Borges 	Sim	Sim	3	0	0	1	
Nathalia Nascimento 	Nathalia Nascimento 	Resplandecer 	VERMELHA	Adriana 21 99344-9138	Não	Sim	2	2	0	2	
Leandro de Freitas Silva Pereira 	Samuel 	Reativando Sonhos 	VERMELHA	Samuel (21) 99917-1524	Não	Não	2	0	Estão desempregados 	2	
Leandro de Freitas Silva Pereira 	Samuel (21) 9917-1524	Reativando Sonhos 	VERMELHA	Liliane Coelho (21) 99274-0479	Sim	Sim	3	0	1 recebe aposentadoria 	3	
Valdir de Oliveira Cerejo 21986860345	Pr Anderson Silva 21970772787	Alfha e Ômega 	AZUL	Beatriz da Silva Braga  21 966989931	Sim	Sim	1	2	0	1	
Janielle	Fabiano	A casa é  sua	AZUL	Isa 968399282	Não	Sim	2	2	1	1	
Carlos Alberto Oliveira Mendes - 21 96580-0513	Saulo Brasileiro - 21 98323-9609	Célula Talmidim 	LARANJA	Nelson Cordeiro Alves 	Não	Sim	Morando sozinho 	Não 	Só só 	Ele esta desempregado 	
Miriam Ferreira	Miriam Ferreira	Conexão	VERDE	Gabriel Lopes de Almeida 21 98014-3132 	Sim	Sim	2	1	1	2	
Mara Lucia de Castro Faber dos Santos(21) 976734522	Miriam Ferreira 	Esperança	VERMELHA	Eliane Moreira 	Não	Sim	01	01	Atualmente desempregada	01	
Alessandra 21 964517088	Denize Costa 	Vida em Vidas 	VERMELHA	Jaqueline Bravo 2199300-0899	Sim	Sim	1	1	0	1	
Lilian ( 21987211488)	Lilian ( 21987211488)	Celeiro de benção 	LARANJA	Lucimar ( 21 99533-9985)	Não	Sim	2	2	1	1	
Lilian ( 21987211488)	Lilian ( 21987211488)	Celeiro de benção 	LARANJA	Fabiane ( 21 99746-7097)	Não	Sim	2	1	1	1	
Lilian (21987211488)	Lilian (21987211488)	Celeiro de bençãos 	LARANJA	Alexandra (21 98196-0552)	Não	Sim	1	1	0	1	
Rúbia Olive 98233-5802	Rebeca Levate 21 96531-0707	Fruto do Espírito 	VERDE	Giselly Coelho 	Sim	Sim	2	0	0	2	
Claudia Lourenço 21993640431	Viviane Amorim  21 96433-5354	Influenciadores do Amor 	VERMELHA	Danielle CORRIÇA 21 99195-0304	Sim	Sim	1 adulto e 1 adolescente  	0	0	2	
ARETHA 	Rafael	Transborde 	AMARELA	Vânia Lúcia    / 92022 6837	Sim	Sim	1 pessoa 	Não  tem	1	1	
Adriano Basilio	Adriano Basilio	Agape	AMARELA	Maurício Romero 21 996591884	Sim	Sim	1	1 Criança	Ele está desempregado 	Só ele 	
Edson 21 99031-5422 	Cadu 2199081-5584	Dorcas 	ROXA	Carlos 2198082-7087	Não	Sim	1	1 Criança	Ninguém 	1	
Thiago  F. Portela - (21) 98233-5099	Thiago F. Portela - (21) 98233-5099	Coração do pai 	LARANJA	Altamiro Lermos. (21) 96836-9882	Sim	Sim	Uma , não tem criança. 	1 Criança	 Uma, não é carteira assinada .	Uma 	
 Pr Edson Quintanilha Barbosa / 21 98852-3480	Carlos / 21 97975-7079	Amor & Milagres	VERDE	Aline Storte/ 21 97171-9760	Sim	Sim	1 adulto	1 Criança, Acima de 4 Crianças	Nenhuma	1	
Pr Edson Quintanilha / 21 97655-3480	Carlos / 21 97975-7079	Amor & Milagres	VERDE	Maurício  / 21 97680-4197	Sim	Não	1	Acima de 4 Crianças	Nenhuma 	1	
Pr Edson Quintanilha  / 21 98852-3480	Carlos / 97975-7079	Amor & Milagres	VERDE	Mário Rodrigues 	Não	Não	1	1 Criança	-	Trabalha de biscate	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Pr. Rubem Teixeira	Pr. Rubem Teixeira	PRESIDIO	AZUL	Familiares dos presos	Não	Não	1	1	0	1	
Ketelenroze Souza de azeredo da silva	Lilian dias +55 21 98721-1488	Ramos da videira	LARANJA	Raquel Vianna +55 21 99255-4061	Não	Sim	2	1 Criança	Nenhuma . Mãe não trabalha e benefício foi suspenso. Filha 16 anos retardo mental autismo 	1	
Míriam Gonçalves de Lima 	Milton Barros 	Conexão 	VERMELHA	Michelle Moretti 	Sim	Sim	3	1 Criança	Nenhuma, duas filhas uma jovem e outra adolescente 	2	
Alex da Silva Ribeiro 21994403599	21976329267	Porta aberta	VERMELHA	Adilson	Sim	Sim	4	2 Crianças	1	3	
Thiago	Thiago	Coração do pai 	LARANJA	Altamiro 	Sim	Sim	Um	1 Criança	Ele é biscate 	Um	
Leonardo Oliveira (21)980332226	Fabiano (21) 98868-8630	Morada	AZUL	Jairo Barbosa (21) 97468-7978	Não	Sim	2	1 Criança	0	0	
Diogo Martins Sanches 2198046-9929 	Welton Santana 2199754-6483	O Novo de Deus 	VERDE	Fernando Henrique Gama Miranda da Silva	Sim	Sim	2	Sem Crianças	2	0	
Diego Fonseca - 21959327935	Vitor Jorge - 2199227-8969	Nova Aliança	AZUL	Jansen - 2197701-3700	Sim	Sim	1	1 Criança	1	0	
Diogo Teixeira 21 965109833	Marcos Vinicius 21 96807-9201	Amor Incondicional 	AMARELA	Micheli da Silva de Barros (21)974510218	Não	Não	3	2 Crianças	2 salários mínimos 	1	
Miriam :: 21 98201-6716	pr Leo :: 21 98201-6720	Conexão	VERDE	Mateus e Agnes	Não	Não	3	2 Crianças	O Mateus vende bala no sinal próximo à igreja	3	
Miriam :: 21 98201-6716	pr Leo :: 98201-6720	Conexão	VERMELHA	Valdineia Barbosa da Silva	Não	Não	2	2 Crianças	0	2	
Robson Carlos Figueiredo (21) 99695-6607 	Pastor Léo (21) 98201-6720	Aliança	VERMELHA	Washington Francisco Pereira (21) 97070-8155	Não	Não	1	Sem Crianças	Nenhuma	1	
Laísa 21 988902198	welton Santana 21 997546483	Recomeço 	VERDE	wanderson de lima	Não	Não	1	Acima de 3 Crianças	Nenhuma 	1	
Edmar Peluchi 21965422426	Leonardo (21) 98033-2226	Rio de Vida 	AZUL	Rosa Maria de Souza Costa Ribeiro (21) 98519-4991	Sim	Sim	3	Sem Crianças	1	2	
Camilla (21-99111-2626)	Luciano (21-972098953)	Floresça	BRANCA	Elizangela Monteiro (21-97510-8571)	Sim	Sim	3	Sem Crianças	0	4	
Cristiano - (21) 97487-7979		Revived in Christ 	LARANJA	Débora Raquel Barbosa Carlos	Sim	Sim	1	1 Criança	0	1	
Edson Neves 21 99031-5422 	Cadu 21 99081-5584	Dorcas	ROXA	Isabela 	Não	Não	Dois	2 Crianças	Ninguém 	Dois	
Eduardo Andrade (21) 99257-9771	Alexandre (21) 97695-6017	Conexão Ágape	AMARELA	Josefa Rosa	Não	Não	3	2 Crianças	1	1	
Diego Fonseca 	Vitor - 2199227-8969	Nova aliança 	AZUL	Jansen  2197701-3700	Sim	Sim	1	1 Criança	1	0	
Rodrigo Laeber (21) 98387-8282	Pra. Dani	Solo Fértil 	LARANJA	Jesiel Torres 	Sim	Sim	4	1 Criança	1	1	
Michelle Bezerra 	Raphael 	Verdadeiro amor 	AMARELA	Carlos Alberto  976564556	Não	Não	2	1 Criança	Os dois desempregados 	Os dois 	
Ângelo 	Fabiano	Tempo de recomeçar 	AZUL	Ângelo romualdo 	Sim	Sim	2	1 Criança	0	2	
Samuel da Silva Pessôa 	Samuel da Silva Pessôa 	Vida Plena	VERMELHA	Marco Aurélio 21-99719-0318	Sim	Sim	2	2 Crianças	Nenhuma	1	
Gustavo do nascimento teixeira, 2197481-2212	Saulo, 21 98272-7064	Estela de Davi 	VERDE	Maristela, 21 9 9302-5040	Não	Sim	1	1 Criança	1 pessoas porém sem pagamento há três meses 	0 mas sem pagamento á três meses 	
Jessica Maria (21) 99056-1537	Luana Campos (21) 98156-5414	Life Saver	ROXA	Robson (21) 98133-4353	Não	Não	2	Sem Crianças	Atualmente nenhuma 	Todos	
Elisabete Figueiredo Davi	Leandro / 21 99530-1282	Deus cuida de mim	LARANJA	Elenilda souza castro/  21 97016-1849	Não	Não	1	Sem Crianças	Nenhuma	1	
Thiago  96418-8763 	Saulo Moura 996715140	ASAFE 	VERDE	Diogo dos Santos Leite 	Não	Sim	2	Sem Crianças	Desempregado , aguardando cirurgia nos olhos 	2	
Lilian 21987211488	Lilian 21987211488	Celeiro de benção 	LARANJA	Carlos Alberto Oliveira da Silva	Sim	Sim	1	Sem Crianças	0	1	
Alessandra Martins e Renato (21 96451-7088)	Denize Costa (21 96536-3494)	Vida em vidas 	VERMELHA	Magda Borges (21 98633-9122)	Sim	Sim	4	1 Criança	1 pessoa 	3 pessoas 	
Mirian Laeber (21 98349-8038)	Vinicius e Laís (21 96410-7265) (21 96415-2183)	Solo Fértil 	LARANJA	Luciene (21 99323-7213)	Sim	Sim	3	Sem Crianças	1	1. A Luciete mora com a mãe idosa e que precisa de cuidados diários.	
Areta (21) 97035-2417	Jôse	Transborde	AMARELA	Kelly Regina	Não	Não	1	1 Criança	Agora nenhuma 	Ela ,e o pai da criança q ,tá fugido!	
Ronaldo Mamede 	Pr Jonatas Soares 	Arca da aliança 	VERMELHA	Alex Costa - 81 99243-4080	Sim	Sim	1	Sem Crianças	Começou o trabalho agora 	0	
Alexander 21 99427-9930 	Saulo e patricia 	Esperanca 	VERDE	Paula Duarte 	Sim	Sim	2	1 Criança	Nenhuma 	2	
Luis 21964896337	Saulo e Patricia	Zion	VERDE	Marluce 21964897562	Sim	Sim	2	2 Crianças	1	1	
Fabricia Gonçalves 21996767864	Fabricia Gonçalves 21996767864	Deus do impossível 	LARANJA	Flávia Pereira da Silva Vicente	Não	Sim	3	2 Crianças	Uma só, com vendas no momento 	2	
Leonardo Oliveira 21980332226	Fabiano Souza 21988688630	Morada	AZUL	Leonardo Alexandrino 21975220643	Sim	Sim	2	2 Crianças	1	1	
Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Aparecido Vicente +5521993169343	Sim	Sim	2	1 Criança	0	2	
Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Kauane Sampaio +5521974691818	Sim	Sim	2	2 Crianças	0	2	
Michel +5521997868813	Nathalia +5521974493493	Mensageiros 	VERMELHA	Joana darc +5521991394972	Não	Sim	2	1 Criança	0	2	
Alex sandro da silva lima	Romildo dias +55 21 96767-5478	Frutificando em cristo 	VERDE	Silvana brito das merces e silva lima	Sim	Sim	3	1 Criança	1 aposentado 	1 pessoa desempregada 	
Marcelo Santana 21 988773453	Luciano oliveira +55 21 97209-8953	Conectados com Deus 	BRANCA	Larice Mathias +55 21 96991-0490	Não	Não	1	Acima de 3 Crianças	1	0	
Carlos Alberto Oliveira Mendes/2196580-0513	Saulo/2198323-9609	Célula Talmidim	LARANJA	Nelselino Cordeiro Alves/2199407-6416	Não	Não	1	Sem Crianças	1	1	
Alexandre 21 99327-3288	 Samuel 21 99917-1524	Rio da Vida	VERMELHA	Raquel Mattos Quintanilha 21965316724	Não	Não	1	2 Crianças	Ninguém 	1	
Ketelenroze Souza de azeredo da silva	Lilian dias +55 21 98721-1488	Ramos da videira	LARANJA	GladysLene 	Sim	Sim	Um	1 Criança	Nenhuma 	Uma	21 991473948
Jorge Alves Menezes Junior	Janielle Souza 21 98615-5451	Emmanuel: Deus conosco	AZUL	Flor de Lotus	Não	Sim	2	1 Criança	0	2	21 98511-3945
Danúbia	Shirley 	21 98221-8175	VERDE	Tarcila 	Sim	Sim	4	1 Criança	Nenhuma 	Todos 	21 99539-9588
Rafael Dino 	VINICIUS	Ide	LARANJA	Thaís 21 981384891	Não	Não	1	Sem Crianças	Nenhuma	1	21 991904173
Nathalia Nascimento 	Nathalia Nascimento 21974493493	Resplandecer 	VERMELHA	Salomão +55 21 97061-5042	Não	Sim	2	2 Crianças	0	2	Resplandecer 
Nathalia Nascimento 	Nathalia Nascimento 	Resplandecer 	VERMELHA	Adriana +55 21 99344-9138	Não	Sim	2	2 Crianças	0	2	21974493493
Cristiano Gomes 	Natasia 	Reviver in christ	LARANJA	Caroline Menezes 	Sim	Sim	2	Sem Crianças	Nehuma	2	21974877979
Fábio Gonçalves da Silva 	(21) 965363494	Casa de Paz	VERMELHA	Liliane dos Santos Coelho 	Sim	Sim	3 adultos 	Sem Crianças	01 aposentada 	02	(21)979752366
Marcus José Santos de Carvalho 	Saulo +55 21 98272-7064	Elyon 	VERDE	Tereza Cristina Alves Ferreira Moraes 	Sim	Sim	2	Sem Crianças	2	0	21976582421
Saulo Brasileiro 	Weriton 21964589734	Nova Identidade 	LARANJA	Sandra 2197881-1080	Não	Não	2	Sem Crianças	Ninguém 	Todos 	Lar de Milagres 
Samuel Pessôa 	Samuel Pessôa 	Vida Plena	VERMELHA	Jacira Gomes - 21-99055-7154	Sim	Sim	2	1 Criança	1	1	21-99917-1524
Cristiano 	Natassia 	 21 98144-7100	LARANJA	Mariana 21998401837	Sim	Sim	3	1 Criança	Nenhuma 	3	 21 97487-7979
Claudia Lourenço	Viviane Amorim	Influenciadores do Amor 	VERMELHA	Danielle CORRIÇA 	Sim	Sim	1 adulto e 1 adolescente 	Sem Crianças	Nenhuma	2	21993640431
Ângelo romualdo 	Fabiano 	Tempo de recomecar 	AZUL	Angelo romualdo 	Sim	Sim	2	1 Criança	Estamos fazendo bico 	2	21985425637
Edmar Peluchi 	Leonardo 	Rio de Vida	AZUL	Miriam	Sim	Sim	2	Sem Crianças	Ninguém 	Todos	21965422426
X	X	X	VERDE	X	Sim	Sim	3	Sem Crianças	1	1	X
Diogo Teixeira 	Marcos Vinicius Ribeiro 	 2196807-9201	AMARELA	Micheli da Silva de Barros 21974510218	Não	Não	3	2 Crianças	1	1	21965109833
Leandro de Freitas Silva Pereira 	Samuel   (21) 9 9729-7219	Reativando Sonhos 	VERMELHA	Valdecira 	Não	Não	1	Sem Crianças	Nenhuma 	1	21980520846`;

const lines = rawData.split('\n');
const cells = new Map();

function cleanName(name) {
    if (!name) return '';
    return name.replace(/\(.*\)/, '').replace(/[0-9+:\-\/@]/g, '').trim();
}

function extractPhone(str) {
    if (!str) return '';
    const match = str.match(/(?:(?:\+55\s?)?\(?\d{2}\)?\s?\d{4,5}[-\s]?\d{4})|(?:\d{8,11})/g);
    return match ? match[0].replace(/[^\d]/g, '') : '';
}

function generateId(seed) {
    return crypto.createHash('sha256').update(seed).digest('hex').substring(0, 8).toUpperCase();
}

lines.forEach(line => {
    const parts = line.split('\t');
    if (parts.length < 4) return;

    let liderFull = parts[0] || '';
    let supervisorFull = parts[1] || '';
    let cellName = (parts[2] || '').trim();
    let rede = (parts[3] || '').trim().toUpperCase();
    let altPhone = parts[11] || '';

    if (!cellName || cellName.toLowerCase() === 'x') return;

    // Normalização básica de nomes de célula
    const normalizedCellName = cellName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const key = `${rede}_${normalizedCellName}`;

    if (!cells.has(key)) {
        let liderName = cleanName(liderFull);
        let liderPhone = extractPhone(liderFull) || extractPhone(altPhone);
        
        let supervisorName = cleanName(supervisorFull);
        let supervisorPhone = extractPhone(supervisorFull);

        // Se o nome do líder for igual ao do supervisor, tentamos pegar o telefone do campo 11
        if (liderName === supervisorName && !liderPhone) {
             liderPhone = extractPhone(altPhone);
        }

        cells.set(key, {
            id_celula: generateId(key),
            Rede: rede,
            NomeDaCelula: cellName,
            Lider: liderName,
            Telefone_Lider: liderPhone,
            Supervisor: supervisorName,
            Telefone_Supervisor: supervisorPhone,
            email: `${normalizedCellName.toLowerCase().replace(/\s+/g, '')}${rede.toLowerCase()}@gmail.com`
        });
    }
});

console.table(Array.from(cells.values()));
console.log(JSON.stringify(Array.from(cells.values()), null, 2));

