@echo off
title PetRankings - Tunel SSH Seguro Oracle Cloud
echo ======================================================================
echo  [PetRankings] Iniciando tunel SSH seguro com o PostgreSQL da Oracle
echo  Porta local: localhost:5433 -^> Oracle Cloud 168.138.144.63:5432
echo  Deixe esta janela aberta enquanto cadastra produtos ou usa o Studio.
echo  Pressione Ctrl+C para encerrar quando terminar.
echo ======================================================================
ssh -i "D:\Projetos\ssh-key-2026-10-03.key" -L 5433:127.0.0.1:5432 -N ubuntu@168.138.144.63
