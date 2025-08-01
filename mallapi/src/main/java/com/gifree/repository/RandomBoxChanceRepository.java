package com.gifree.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.gifree.domain.RandomBoxChance;

public interface RandomBoxChanceRepository extends JpaRepository<RandomBoxChance, Long> {
    
    Optional<RandomBoxChance> findByMemberEmail(String memberEmail);
    
    boolean existsByMemberEmail(String memberEmail);
} 